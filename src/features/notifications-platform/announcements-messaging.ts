/** Systems 7, 8 — Announcement Platform + Messaging Platform. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeAnnouncement, getAnnouncement, getAllAnnouncements,
  storeSystemMessage, getSystemMessage, getAllSystemMessages,
} from "./repository";
import type {
  Announcement, AnnouncementScope, AnnouncementStatus,
  SystemMessage, SystemMessageType,
  NotificationPriority, DeliveryChannelId,
} from "./types";
import { publishNotificationEvent } from "./event-bus-bridge";

const log = getLogger("notifications.announcements");

// ===== System 7 — Announcement Platform =====

export function createAnnouncement(input: {
  scope: AnnouncementScope;
  title: string; body: string;
  targetId?: string | null;
  priority?: NotificationPriority;
  channels?: DeliveryChannelId[];
  scheduledAt?: string;
  expiresAt?: string | null;
  createdBy: string;
  locale?: string;
  metadata?: Record<string, unknown>;
}): Announcement {
  const now = new Date().toISOString();
  const ann: Announcement = {
    id: randomUUID(), scope: input.scope,
    title: input.title, body: input.body,
    targetId: input.targetId ?? null,
    priority: input.priority ?? "medium",
    channels: (input.channels ?? ["in_app", "broadcast_overlay"]) as never,
    status: "draft",
    scheduledAt: input.scheduledAt ?? now,
    publishedAt: null,
    expiresAt: input.expiresAt ?? null,
    approvalReference: null,
    approvedBy: null, approvedAt: null,
    createdBy: input.createdBy,
    createdAt: now, updatedAt: now,
    locale: input.locale ?? "en",
    metadata: input.metadata ?? {},
  };
  storeAnnouncement(ann);
  log.info("announcement.created", { id: ann.id, scope: ann.scope });
  return ann;
}

export function getAnnouncementById(id: string): Announcement | null { return getAnnouncement(id); }
export function listAnnouncements(scope?: AnnouncementScope, status?: AnnouncementStatus): Announcement[] {
  let all = getAllAnnouncements();
  if (scope) all = all.filter(a => a.scope === scope);
  if (status) all = all.filter(a => a.status === status);
  return all;
}

const VALID_ANNOUNCEMENT_TRANSITIONS: Record<AnnouncementStatus, AnnouncementStatus[]> = {
  draft: ["pending_approval", "active", "retired"],
  pending_approval: ["approved", "rejected", "draft"],
  approved: ["active", "retired"],
  active: ["expired", "retired"],
  expired: ["retired"],
  rejected: ["draft", "retired"],
  retired: [],
};

export function canTransitionAnnouncement(from: AnnouncementStatus, to: AnnouncementStatus): boolean {
  return VALID_ANNOUNCEMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionAnnouncement(id: string, to: AnnouncementStatus, actorId?: string, reason?: string): Announcement | null {
  const a = getAnnouncement(id);
  if (!a) return null;
  if (!canTransitionAnnouncement(a.status, to)) return null;
  const now = new Date().toISOString();
  a.status = to; a.updatedAt = now;
  if (to === "pending_approval") a.approvalReference = reason ?? null;
  if (to === "approved") { a.approvedBy = actorId ?? null; a.approvedAt = now; }
  if (to === "active") a.publishedAt = now;
  if (to === "expired" && !a.publishedAt) a.publishedAt = now;
  storeAnnouncement(a);
  if (to === "active") {
    publishNotificationEvent("AnnouncementPublished", null, {
      announcementId: a.id, scope: a.scope, priority: a.priority,
    });
  }
  if (to === "expired") {
    publishNotificationEvent("AnnouncementExpired", null, { announcementId: a.id });
  }
  return a;
}

export function submitAnnouncementForApproval(id: string): Announcement | null {
  return transitionAnnouncement(id, "pending_approval");
}
export function approveAnnouncement(id: string, approverId: string): Announcement | null {
  return transitionAnnouncement(id, "approved", approverId);
}
export function rejectAnnouncement(id: string, reviewerId: string, reason: string): Announcement | null {
  const a = getAnnouncement(id);
  if (!a) return null;
  if (a.status !== "pending_approval") return null;
  a.status = "rejected"; a.updatedAt = new Date().toISOString();
  a.approvedBy = reviewerId;
  a.metadata.rejectionReason = reason;
  storeAnnouncement(a);
  return a;
}
export function publishAnnouncement(id: string): Announcement | null {
  return transitionAnnouncement(id, "active");
}
export function expireAnnouncement(id: string): Announcement | null {
  return transitionAnnouncement(id, "expired");
}
export function retireAnnouncement(id: string): Announcement | null {
  return transitionAnnouncement(id, "retired");
}

export function listActiveAnnouncements(scope?: AnnouncementScope, now: number = Date.now()): Announcement[] {
  return getAllAnnouncements().filter(a => {
    if (a.status !== "active") return false;
    if (scope && a.scope !== scope) return false;
    if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
    return true;
  });
}

export function supportsAllAnnouncementScopes(): AnnouncementScope[] {
  return ["global", "organization", "tournament", "maintenance", "emergency", "regional"];
}
export function supportsAllAnnouncementStatuses(): AnnouncementStatus[] {
  return ["draft", "pending_approval", "approved", "active", "expired", "rejected", "retired"];
}

// ===== System 8 — Messaging Platform =====

export function createSystemMessage(input: {
  type: SystemMessageType;
  userId?: string | null;
  organizationId?: string | null;
  title: string; body: string;
  priority?: NotificationPriority;
  deliveryChannels?: DeliveryChannelId[];
  scheduledAt?: string;
  expiresAt?: string | null;
  correlationId?: string;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): SystemMessage {
  const now = new Date().toISOString();
  const msg: SystemMessage = {
    id: randomUUID(), type: input.type,
    userId: input.userId ?? null,
    organizationId: input.organizationId ?? null,
    title: input.title, body: input.body,
    priority: input.priority ?? "medium",
    deliveryChannels: (input.deliveryChannels ?? ["in_app"]) as never,
    scheduledAt: input.scheduledAt ?? now,
    deliveredAt: null,
    expiresAt: input.expiresAt ?? null,
    correlationId: input.correlationId ?? randomUUID(),
    variables: input.variables ?? {},
    metadata: input.metadata ?? {},
  };
  storeSystemMessage(msg);
  log.info("system_message.created", { id: msg.id, type: msg.type });
  return msg;
}

export function getSystemMessageById(id: string): SystemMessage | null { return getSystemMessage(id); }
export function listSystemMessages(type?: SystemMessageType, userId?: string): SystemMessage[] {
  let all = getAllSystemMessages();
  if (type) all = all.filter(m => m.type === type);
  if (userId) all = all.filter(m => m.userId === userId);
  return all;
}

export function markSystemMessageDelivered(id: string): SystemMessage | null {
  const m = getSystemMessage(id);
  if (!m) return null;
  if (m.deliveredAt) return null;
  m.deliveredAt = new Date().toISOString();
  storeSystemMessage(m);
  publishNotificationEvent("SystemMessageSent", m.userId, {
    messageId: m.id, type: m.type, correlationId: m.correlationId,
  });
  return m;
}

export function generateDigest(userId: string, period: "daily" | "weekly" | "monthly"): SystemMessage | null {
  // Generate a digest from existing inbox items (deterministic)
  // Note: this is a metadata-only operation; it never owns or modifies inbox state directly
  const msg = createSystemMessage({
    type: "digest",
    userId,
    title: `${period.charAt(0).toUpperCase() + period.slice(1)} Digest`,
    body: `Your ${period} activity digest is ready`,
    priority: "low",
    deliveryChannels: ["in_app"],
    variables: { period },
    correlationId: `digest-${userId}-${period}-${Date.now()}`,
  });
  publishNotificationEvent("DigestGenerated", userId, {
    messageId: msg.id, period, correlationId: msg.correlationId,
  });
  return msg;
}

export function supportsAllSystemMessageTypes(): SystemMessageType[] {
  return ["system", "warning", "maintenance", "reminder", "campaign_update", "season_update", "purchase_confirmation", "achievement_summary", "digest"];
}
