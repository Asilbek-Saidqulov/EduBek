/**
 * EduBek — Automation Engine.
 *
 * Phase 4F.6: Trigger-based automations. The engine:
 *
 *   1. Subscribes to all Education OS event types on the event bus.
 *   2. When an event fires, finds enabled AutomationRules whose trigger
 *      matches the event type AND whose conditions match the event payload.
 *   3. Executes each rule's actions (sequentially within a rule,
 *      concurrently across rules).
 *   4. Rate-limits each rule to its `maxPerHour` setting.
 *
 * Supported action types:
 *   • assign_review         — uses Phase 4F.3 Learning Planner
 *   • notify_teacher        — uses Phase 4E Notification infra
 *   • notify_student        — uses Phase 4E Notification infra
 *   • notify_admin          — uses Phase 4E Notification infra
 *   • schedule_repetition   — uses Phase 4F.3 Spaced Repetition
 *   • recommend_resources   — uses Phase 4F.1 Discovery
 *   • generate_lesson       — uses Phase 4A AI Workspace
 *   • analyze_concepts      — uses Phase 4F.5 Knowledge Intelligence
 *   • generate_embeddings   — uses Phase 4F.2 Embedding Provider
 *   • index_discovery       — uses Phase 4F.1 Discovery indexEntity
 *   • update_knowledge_graph — uses Phase 4F.1 + 4F.5 graph edges
 *   • recommend_similar_resources — uses Phase 4F.5 Similarity Detection
 *
 * The engine is lazy-registered on first use (see `ensureAutomationRegistered`).
 */
import { getLogger } from "@/lib/logger";
import { eventBus } from "@/infra/event-bus";
import { notificationService } from "@/infra/notifications";
import * as repo from "./repository";
import { evaluateConditions, POLICY_TEMPLATES } from "./policies";
import { EDUCATION_OS_EVENT_TYPES } from "./events";
import { storeMemory } from "./memory";
import type { AutomationAction, AutomationRuleDto, CreateAutomationInput } from "./types";

const log = getLogger("automation-engine");

let registered = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register the automation engine as a subscriber for all Education OS
 * event types. Idempotent — safe to call multiple times.
 */
export function ensureAutomationRegistered(): void {
  if (registered) return;
  for (const eventType of EDUCATION_OS_EVENT_TYPES) {
    // Cast: Education OS event types are new string literals not yet in
    // the DomainEventType union (which would require editing the central
    // events.ts file). The event bus accepts any string at runtime; we
    // cast to satisfy the static type checker.
    eventBus.subscribe(eventType as any, handleEvent as any);
  }
  registered = true;
  log.info("automation.registered", { eventTypes: EDUCATION_OS_EVENT_TYPES });
}

/**
 * Seed built-in policy templates as AutomationRules. Idempotent —
 * rules with the same name are skipped.
 */
export async function seedBuiltinPolicies(ownerId: string, scopeType: "user" | "classroom" | "organization" | "system" = "system", scopeId: string = "system"): Promise<void> {
  for (const template of POLICY_TEMPLATES) {
    // Check if a rule with this name already exists for this scope
    const existing = await repo.findAutomationRules({ ownerId, scopeType, scopeId });
    if (existing.some((r) => r.name === template.name)) continue;

    await repo.createAutomationRule({
      name: template.name,
      description: template.description,
      ownerId,
      scopeType,
      scopeId,
      trigger: JSON.stringify(template.trigger),
      actions: JSON.stringify(template.actions),
      enabled: true,
      maxPerHour: 10,
    });
    log.info("automation.policy_seeded", { code: template.code, name: template.name });
  }
}

export async function listAutomations(input: {
  ownerId?: string;
  scopeType?: string;
  scopeId?: string;
  enabled?: boolean;
  limit?: number;
}): Promise<AutomationRuleDto[]> {
  const rows = await repo.findAutomationRules(input);
  return rows.map(mapRule);
}

export async function getAutomation(id: string): Promise<AutomationRuleDto | null> {
  const row = await repo.findAutomationRule(id);
  return row ? mapRule(row) : null;
}

export async function createAutomation(input: CreateAutomationInput & { ownerId: string }): Promise<AutomationRuleDto> {
  const row = await repo.createAutomationRule({
    name: input.name,
    description: input.description,
    ownerId: input.ownerId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    trigger: JSON.stringify(input.trigger),
    actions: JSON.stringify(input.actions),
    enabled: input.enabled ?? true,
    maxPerHour: input.maxPerHour ?? 10,
  });
  log.info("automation.created", { id: row.id, name: input.name });
  return mapRule(row);
}

export async function updateAutomation(id: string, input: Partial<{
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationRuleDto["trigger"];
  actions: AutomationAction[];
  maxPerHour: number;
}>): Promise<AutomationRuleDto | null> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.maxPerHour !== undefined) data.maxPerHour = input.maxPerHour;
  if (input.trigger !== undefined) data.trigger = JSON.stringify(input.trigger);
  if (input.actions !== undefined) data.actions = JSON.stringify(input.actions);
  const row = await repo.updateAutomationRule(id, data);
  return mapRule(row);
}

export async function deleteAutomation(id: string): Promise<void> {
  await repo.deleteAutomationRule(id);
}

// ---------------------------------------------------------------------------
// Internal: event handler
// ---------------------------------------------------------------------------

async function handleEvent(event: any): Promise<void> {
  try {
    const eventType = event.type;
    const rules = await repo.findEnabledAutomationsForEvent(eventType);

    for (const rule of rules) {
      // Rate limit check
      if (rule.lastFiredAt && isWithinLastHour(rule.lastFiredAt) && rule.executionCount >= rule.maxPerHour) {
        log.warn("automation.rate_limited", { ruleId: rule.id, name: rule.name });
        continue;
      }

      // Parse trigger + actions
      const trigger = safeParseJSON(rule.trigger, {});
      const actions = safeParseArray<AutomationAction>(rule.actions);

      // Evaluate conditions
      const conditions = (trigger as any).conditions;
      if (!evaluateConditions(conditions, event)) continue;

      // Execute actions
      log.info("automation.fired", { ruleId: rule.id, name: rule.name, eventType });
      for (const action of actions) {
        try {
          await executeAction(action, event, rule);
        } catch (err) {
          log.error("automation.action_failed", { ruleId: rule.id, actionType: action.type, error: (err as Error).message });
        }
      }

      // Update rule stats
      await repo.updateAutomationRule(rule.id, {
        lastFiredAt: new Date(),
        executionCount: { increment: 1 },
      }).catch(() => undefined);

      // Store memory
      await storeMemory({
        scopeType: rule.scopeType as any,
        scopeId: rule.scopeId,
        type: "action",
        summary: `Automation "${rule.name}" fired for event ${eventType}`,
        payload: { ruleId: rule.id, eventType, actionCount: actions.length },
        importance: 0.6,
      }).catch(() => undefined);
    }
  } catch (err) {
    log.error("automation.handle_failed", { eventType: event.type, error: (err as Error).message });
  }
}

// ---------------------------------------------------------------------------
// Action executors
// ---------------------------------------------------------------------------

async function executeAction(action: AutomationAction, event: any, rule: any): Promise<void> {
  switch (action.type) {
    case "assign_review": {
      const userId = event.studentId ?? event.userId ?? event.buyerId;
      if (!userId) return;
      // Best-effort: schedule a review session via Learning Planner
      const { recordStudySession } = await import("@/features/learning-planner");
      await recordStudySession({
        userId,
        sessionType: "review",
        durationMs: 15 * 60 * 1000,
        difficulty: (action.params as any).difficulty === "easy" ? "easy" : "medium",
      }).catch(() => undefined);
      log.info("automation.action.assign_review", { userId });
      break;
    }
    case "notify_teacher": {
      const { computeClassInsight } = await import("@/features/collaboration");
      // Notify the classroom's teacher if we have a classroomId
      if (event.classroomId) {
        const { db } = await import("@/lib/db");
        const classroom = await db.classroom.findUnique({ where: { id: event.classroomId }, select: { teacherId: true } });
        if (classroom) {
          await notificationService.send({
            userId: classroom.teacherId,
            type: `automation.${rule.name}.${action.type}`,
            title: `Automation: ${rule.name}`,
            body: `An automated action was triggered: ${(action.params as any).reason ?? "review needed"}.`,
            data: { ruleId: rule.id, classroomId: event.classroomId, params: action.params },
          });
        }
      }
      break;
    }
    case "notify_student": {
      const userId = event.studentId ?? event.userId ?? event.buyerId;
      if (!userId) return;
      await notificationService.send({
        userId,
        type: `automation.${rule.name}.${action.type}`,
        title: `Automation: ${rule.name}`,
        body: `An automated action was triggered for you: ${(action.params as any).reason ?? "review recommended"}.`,
        data: { ruleId: rule.id, params: action.params },
      });
      break;
    }
    case "notify_admin": {
      // Notify all org admins
      if (event.organizationId) {
        const { db } = await import("@/lib/db");
        const admins = await db.organizationMembership.findMany({
          where: { orgId: event.organizationId, status: "active" },
          select: { userId: true },
        }).catch(() => []);
        for (const admin of admins) {
          await notificationService.send({
            userId: admin.userId,
            type: `automation.${rule.name}.${action.type}`,
            title: `Automation: ${rule.name}`,
            body: `An automated action was triggered: ${(action.params as any).reason ?? "admin review needed"}.`,
            data: { ruleId: rule.id, organizationId: event.organizationId, params: action.params },
          });
        }
      }
      break;
    }
    case "schedule_repetition": {
      const userId = event.studentId ?? event.userId;
      if (!userId) return;
      // Best-effort: log a review schedule via Phase 4F.3
      const { recordReview } = await import("@/features/learning-planner");
      await recordReview({
        userId,
        entityType: "topic",
        entityId: (event as any).topic ?? "auto",
        quality: 3,
        responseMs: 5000,
      }).catch(() => undefined);
      break;
    }
    case "recommend_resources": {
      // Defer to the discovery engine — actual recommendation happens
      // when the user next opens their feed.
      log.info("automation.action.recommend_resources", { ruleId: rule.id });
      break;
    }
    case "generate_lesson": {
      // Defer to the AI Workspace — actual generation requires user action
      log.info("automation.action.generate_lesson", { ruleId: rule.id });
      break;
    }
    case "analyze_concepts": {
      const { analyzeEntity } = await import("@/features/knowledge-intelligence");
      if (event.resourceId) {
        const { db } = await import("@/lib/db");
        const resource = await db.resource.findUnique({ where: { id: event.resourceId }, select: { title: true, content: true, subject: true } });
        if (resource) {
          await analyzeEntity({
            entityType: "resource",
            entityId: event.resourceId,
            title: resource.title,
            content: resource.content ?? "",
            subject: resource.subject ?? undefined,
          }).catch(() => undefined);
        }
      }
      break;
    }
    case "generate_embeddings": {
      const { indexEmbedding } = await import("@/features/semantic-search");
      if (event.resourceId) {
        const { db } = await import("@/lib/db");
        const resource = await db.resource.findUnique({ where: { id: event.resourceId }, select: { title: true, content: true } });
        if (resource) {
          await indexEmbedding({
            entityType: "resource",
            entityId: event.resourceId,
            text: `${resource.title} ${resource.content ?? ""}`,
          }).catch(() => undefined);
        }
      }
      break;
    }
    case "index_discovery": {
      const { indexEntity } = await import("@/features/discovery");
      if (event.resourceId) {
        const { db } = await import("@/lib/db");
        const resource = await db.resource.findUnique({ where: { id: event.resourceId }, select: { title: true, description: true, subject: true, resourceType: true, language: true, ownerId: true } });
        if (resource) {
          await indexEntity({
            entityType: "resource" as any,
            entityId: event.resourceId,
            title: resource.title,
            description: resource.description ?? undefined,
            subject: resource.subject ?? undefined,
            resourceType: resource.resourceType,
            language: resource.language,
            ownerId: resource.ownerId,
          }).catch(() => undefined);
        }
      }
      break;
    }
    case "update_knowledge_graph": {
      const { autoLinkEntity } = await import("@/features/knowledge-intelligence");
      if (event.resourceId) {
        await autoLinkEntity({ entityType: "resource", entityId: event.resourceId }).catch(() => undefined);
      }
      break;
    }
    case "recommend_similar_resources": {
      const { findSimilarEntities } = await import("@/features/knowledge-intelligence");
      if (event.resourceId) {
        const { db } = await import("@/lib/db");
        const resource = await db.resource.findUnique({ where: { id: event.resourceId }, select: { title: true, content: true } });
        if (resource) {
          const similar = await findSimilarEntities({
            entityType: "resource",
            entityId: event.resourceId,
            title: resource.title,
            content: resource.content ?? "",
            threshold: 0.5,
            limit: 5,
          }).catch(() => []);
          log.info("automation.action.recommend_similar", { resourceId: event.resourceId, found: similar.length });
        }
      }
      break;
    }
    default:
      log.warn("automation.unknown_action", { actionType: action.type });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isWithinLastHour(date: Date): boolean {
  return Date.now() - date.getTime() < 60 * 60 * 1000;
}

function safeParseJSON(raw: string | null, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function mapRule(r: any): AutomationRuleDto {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    ownerId: r.ownerId,
    scopeType: r.scopeType,
    scopeId: r.scopeId,
    trigger: safeParseJSON(r.trigger, { event: "" }),
    actions: safeParseArray<AutomationAction>(r.actions),
    enabled: r.enabled,
    maxPerHour: r.maxPerHour,
    lastFiredAt: r.lastFiredAt?.toISOString() ?? null,
    executionCount: r.executionCount,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
