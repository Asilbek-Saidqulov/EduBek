/** Systems 11, 12 — Notification Mapping + Feature Flag Support. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeNotification, getNotifications, storeFeatureFlag, getFeatureFlag, getAllFeatureFlags } from "./repository";
import type { NotificationRequest, FeatureFlag, FeatureFlagRollout } from "./types";

const log = getLogger("live-events.flags");

// ===== System 11 — Notification Mapping =====
export function createNotificationRequest(input: {
  eventId: string; userId?: string | null;
  audience?: "all" | "participants" | "organization" | "custom";
  kind: string; message: string; scheduledAt: string;
}): NotificationRequest {
  const req: NotificationRequest = {
    id: randomUUID(), eventId: input.eventId,
    userId: input.userId ?? null,
    audience: input.audience ?? "participants",
    kind: input.kind, message: input.message,
    scheduledAt: input.scheduledAt, status: "pending",
  };
  storeNotification(req);
  log.info("notification.requested", { eventId: input.eventId, kind: input.kind });
  return req;
}

export function getNotificationsForEvent(eventId: string): NotificationRequest[] {
  return getNotifications(eventId);
}

export function cancelNotification(eventId: string, notificationId: string): boolean {
  const list = getNotifications(eventId);
  const n = list.find(r => r.id === notificationId);
  if (!n || n.status !== "pending") return false;
  n.status = "cancelled";
  return true;
}

// ===== System 12 — Feature Flag Support =====
export function createFeatureFlag(input: {
  name: string; description: string;
  rollout?: FeatureFlagRollout; percentage?: number;
  organizationIds?: string[]; countryCodes?: string[];
  schoolIds?: string[]; active?: boolean; eventId?: string | null;
}): FeatureFlag {
  const now = new Date().toISOString();
  const flag: FeatureFlag = {
    id: randomUUID(), name: input.name, description: input.description,
    rollout: input.rollout ?? "disable", percentage: input.percentage ?? 0,
    organizationIds: input.organizationIds ?? [], countryCodes: input.countryCodes ?? [],
    schoolIds: input.schoolIds ?? [], active: input.active ?? false,
    eventId: input.eventId ?? null, createdAt: now, updatedAt: now,
  };
  storeFeatureFlag(flag);
  log.info("feature_flag.created", { flagId: flag.id, name: input.name, rollout: flag.rollout });
  return flag;
}

export function getFeatureFlagById(id: string): FeatureFlag | null { return getFeatureFlag(id); }
export function listFeatureFlags(): FeatureFlag[] { return getAllFeatureFlags(); }

export function enableFeatureFlag(id: string): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.active = true; f.rollout = "enable"; f.percentage = 100;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function disableFeatureFlag(id: string): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.active = false; f.rollout = "disable"; f.percentage = 0;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function emergencyStop(id: string): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.active = false; f.rollout = "emergency_stop"; f.percentage = 0;
  f.updatedAt = new Date().toISOString();
  log.warn("feature_flag.emergency_stop", { flagId: id });
  return f;
}

export function setGradualRollout(id: string, percentage: number): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.rollout = "gradual"; f.percentage = Math.max(0, Math.min(100, percentage));
  f.active = percentage > 0;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function setOrganizationRollout(id: string, orgIds: string[]): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.rollout = "organization"; f.organizationIds = orgIds; f.active = true;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function setCountryRollout(id: string, countryCodes: string[]): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.rollout = "country"; f.countryCodes = countryCodes; f.active = true;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function setSchoolRollout(id: string, schoolIds: string[]): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.rollout = "school"; f.schoolIds = schoolIds; f.active = true;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function setABTestRollout(id: string, percentage: number): FeatureFlag | null {
  const f = getFeatureFlag(id);
  if (!f) return null;
  f.rollout = "ab_test"; f.percentage = Math.max(0, Math.min(100, percentage)); f.active = true;
  f.updatedAt = new Date().toISOString();
  return f;
}

export function isFeatureFlagActive(id: string, context?: { organizationId?: string; countryCode?: string; schoolId?: string }): boolean {
  const f = getFeatureFlag(id);
  if (!f || !f.active) return false;
  if (f.rollout === "enable") return true;
  if (f.rollout === "disable" || f.rollout === "emergency_stop") return false;
  if (f.rollout === "gradual") return f.percentage >= 100;
  if (f.rollout === "organization" && context?.organizationId) return f.organizationIds.includes(context.organizationId);
  if (f.rollout === "country" && context?.countryCode) return f.countryCodes.includes(context.countryCode);
  if (f.rollout === "school" && context?.schoolId) return f.schoolIds.includes(context.schoolId);
  if (f.rollout === "ab_test") return f.percentage >= 50;
  return false;
}
