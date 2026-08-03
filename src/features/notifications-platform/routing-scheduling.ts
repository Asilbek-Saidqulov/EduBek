/** Systems 9, 10 — Notification Routing + Scheduling. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeRoutingRule, getRoutingRule, getAllRoutingRules,
  storeSchedule, getSchedule, getAllSchedules,
} from "./repository";
import type {
  RoutingRule, RoutingCondition, RoutingResult, RoutingRuleOperator,
  NotificationSchedule, ScheduleType, ScheduleStatus,
  NotificationCategory, NotificationPriority, DeliveryChannelId,
} from "./types";
import { publishNotificationEvent } from "./event-bus-bridge";

const log = getLogger("notifications.routing");

// ===== System 9 — Notification Routing =====

export function createRoutingRule(input: {
  name: string; description?: string;
  sourceEvent: string;
  conditions?: RoutingCondition[];
  targetTemplateKey: string;
  targetChannels: DeliveryChannelId[];
  priorityOverride?: NotificationPriority | null;
  active?: boolean;
  order?: number;
  metadata?: Record<string, unknown>;
}): RoutingRule {
  const now = new Date().toISOString();
  const rule: RoutingRule = {
    id: randomUUID(), name: input.name, description: input.description ?? "",
    sourceEvent: input.sourceEvent,
    conditions: input.conditions ?? [],
    targetTemplateKey: input.targetTemplateKey,
    targetChannels: input.targetChannels,
    priorityOverride: input.priorityOverride ?? null,
    active: input.active ?? true,
    order: input.order ?? 100,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeRoutingRule(rule);
  log.info("routing_rule.created", { id: rule.id, sourceEvent: rule.sourceEvent });
  return rule;
}

export function getRoutingRuleById(id: string): RoutingRule | null { return getRoutingRule(id); }
export function listRoutingRules(active?: boolean): RoutingRule[] {
  const all = getAllRoutingRules();
  return active === undefined ? all : all.filter(r => r.active === active);
}

export function deactivateRoutingRule(id: string): RoutingRule | null {
  const r = getRoutingRule(id);
  if (!r) return null;
  r.active = false; r.updatedAt = new Date().toISOString();
  storeRoutingRule(r);
  return r;
}

export function addRoutingCondition(id: string, condition: RoutingCondition): RoutingRule | null {
  const r = getRoutingRule(id);
  if (!r) return null;
  r.conditions.push(condition);
  r.updatedAt = new Date().toISOString();
  storeRoutingRule(r);
  return r;
}

function evaluateCondition(condition: RoutingCondition, payload: Record<string, unknown>): boolean {
  const value = payload[condition.field];
  switch (condition.operator) {
    case "exists":
      return value !== undefined;
    case "equals":
      return String(value) === String(condition.value);
    case "not_equals":
      return String(value) !== String(condition.value);
    case "contains":
      return typeof value === "string" && value.includes(String(condition.value));
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(String(value));
    case "not_in":
      return Array.isArray(condition.value) && !condition.value.includes(String(value));
    case "gt":
      return typeof value === "number" && typeof condition.value === "number" && value > condition.value;
    case "lt":
      return typeof value === "number" && typeof condition.value === "number" && value < condition.value;
    default:
      return false;
  }
}

/**
 * Pure rule engine — maps events to template + channels.
 * Contains NO business logic. Only evaluates declared conditions.
 */
export function routeEvent(sourceEvent: string, payload: Record<string, unknown>): RoutingResult {
  const rules = getAllRoutingRules()
    .filter(r => r.active && r.sourceEvent === sourceEvent)
    .sort((a, b) => a.order - b.order);
  for (const rule of rules) {
    const allMatch = rule.conditions.every(c => evaluateCondition(c, payload));
    if (allMatch) {
      publishNotificationEvent("RoutingRuleMatched", null, {
        ruleId: rule.id, sourceEvent, templateKey: rule.targetTemplateKey,
      });
      return {
        matched: true,
        ruleId: rule.id,
        templateKey: rule.targetTemplateKey,
        channels: rule.targetChannels,
        priority: rule.priorityOverride,
        errors: [],
      };
    }
  }
  return {
    matched: false, ruleId: null, templateKey: null,
    channels: [], priority: null, errors: ["no_matching_rule"],
  };
}

export function supportsAllRoutingOperators(): RoutingRuleOperator[] {
  return ["equals", "not_equals", "contains", "in", "not_in", "gt", "lt", "exists"];
}

// ===== System 10 — Notification Scheduling =====

export function createSchedule(input: {
  type: ScheduleType;
  registryKey: string;
  userId?: string | null;
  organizationId?: string | null;
  scheduledAt: string;
  recurrenceRule?: string | null;
  maxRetries?: number;
  variables?: Record<string, unknown>;
  expiresAt?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): NotificationSchedule {
  const now = new Date().toISOString();
  const schedule: NotificationSchedule = {
    id: randomUUID(), type: input.type,
    registryKey: input.registryKey,
    userId: input.userId ?? null,
    organizationId: input.organizationId ?? null,
    scheduledAt: input.scheduledAt,
    dispatchedAt: null, completedAt: null,
    status: "pending",
    recurrenceRule: input.recurrenceRule ?? null,
    retryCount: 0, maxRetries: input.maxRetries ?? 3,
    variables: input.variables ?? {},
    expiresAt: input.expiresAt ?? null,
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeSchedule(schedule);
  log.info("schedule.created", { id: schedule.id, type: schedule.type });
  return schedule;
}

export function getScheduleById(id: string): NotificationSchedule | null { return getSchedule(id); }
export function listSchedules(status?: ScheduleStatus, type?: ScheduleType): NotificationSchedule[] {
  let all = getAllSchedules();
  if (status) all = all.filter(s => s.status === status);
  if (type) all = all.filter(s => s.type === type);
  return all;
}

const VALID_SCHEDULE_TRANSITIONS: Record<ScheduleStatus, ScheduleStatus[]> = {
  pending: ["dispatched", "cancelled", "expired", "failed"],
  dispatched: ["completed", "failed", "cancelled"],
  completed: [],
  cancelled: [],
  failed: ["pending"],
  expired: [],
};

export function canTransitionSchedule(from: ScheduleStatus, to: ScheduleStatus): boolean {
  return VALID_SCHEDULE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionSchedule(id: string, to: ScheduleStatus, reason?: string): NotificationSchedule | null {
  const s = getSchedule(id);
  if (!s) return null;
  if (!canTransitionSchedule(s.status, to)) return null;
  const now = new Date().toISOString();
  s.status = to;
  if (to === "dispatched") {
    s.dispatchedAt = now;
    publishNotificationEvent("ScheduleDispatched", s.userId, {
      scheduleId: s.id, correlationId: s.correlationId,
    });
  }
  if (to === "completed") s.completedAt = now;
  if (to === "failed") {
    s.retryCount += 1;
    s.metadata.lastFailureReason = reason ?? null;
    if (s.retryCount < s.maxRetries) {
      // Reset to pending for retry
      s.status = "pending";
      s.dispatchedAt = null;
    }
  }
  if (to === "expired" || to === "cancelled") {
    s.metadata.transitionReason = reason ?? null;
  }
  storeSchedule(s);
  return s;
}

export function dispatchSchedule(id: string): NotificationSchedule | null {
  return transitionSchedule(id, "dispatched");
}
export function completeSchedule(id: string): NotificationSchedule | null {
  return transitionSchedule(id, "completed");
}
export function failSchedule(id: string, reason: string): NotificationSchedule | null {
  return transitionSchedule(id, "failed", reason);
}
export function cancelSchedule(id: string, reason?: string): NotificationSchedule | null {
  return transitionSchedule(id, "cancelled", reason);
}
export function expireSchedule(id: string): NotificationSchedule | null {
  return transitionSchedule(id, "expired");
}

export function listDueSchedules(now: number = Date.now()): NotificationSchedule[] {
  return getAllSchedules().filter(s => {
    if (s.status !== "pending") return false;
    if (new Date(s.scheduledAt).getTime() > now) return false;
    if (s.expiresAt && new Date(s.expiresAt).getTime() < now) return false;
    return true;
  });
}

export function listOverdueSchedules(now: number = Date.now()): NotificationSchedule[] {
  const overdueMs = 5 * 60 * 1000; // 5 min
  return getAllSchedules().filter(s => {
    if (s.status !== "pending") return false;
    return now - new Date(s.scheduledAt).getTime() > overdueMs;
  });
}

export function supportsAllScheduleTypes(): ScheduleType[] {
  return ["immediate", "delayed", "scheduled", "recurring", "digest"];
}
export function supportsAllScheduleStatuses(): ScheduleStatus[] {
  return ["pending", "dispatched", "completed", "cancelled", "failed", "expired"];
}
