/** Systems 5, 6 — Inbox Platform + Real-Time Notifications. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeInboxItem, getInboxItem, updateInboxItem, getInboxItems, getAllInboxItems,
  storeRealtime, getRealtime, getAllRealtime, getRealtimeByDedupKey, getRealtimeByGroupKey,
} from "./repository";
import type {
  InboxItem, InboxItemStatus, InboxQuery, InboxResult,
  NotificationCategory, NotificationPriority,
  RealtimeNotification, RealtimeQueueStatus, RealtimeQueueStats,
} from "./types";
import { publishNotificationEvent } from "./event-bus-bridge";

const log = getLogger("notifications.inbox");

// ===== System 5 — Inbox Platform =====

export function deliverToInbox(input: {
  userId: string;
  notificationId: string; registryKey: string;
  title: string; body: string; summary?: string | null;
  category: NotificationCategory; priority: NotificationPriority;
  iconKey?: string | null; deepLink?: string | null;
  actions?: InboxItem["actions"];
  variables?: Record<string, unknown>;
  expirationSeconds?: number | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): InboxItem {
  const now = new Date().toISOString();
  const item: InboxItem = {
    id: randomUUID(), userId: input.userId,
    notificationId: input.notificationId, registryKey: input.registryKey,
    title: input.title, body: input.body, summary: input.summary ?? null,
    category: input.category, priority: input.priority,
    iconKey: input.iconKey ?? null, deepLink: input.deepLink ?? null,
    actions: input.actions ?? [],
    status: "unread",
    deliveredAt: now, readAt: null,
    archivedAt: null, dismissedAt: null,
    pinnedAt: null, expiredAt: input.expirationSeconds ? new Date(Date.now() + input.expirationSeconds * 1000).toISOString() : null,
    deletedAt: null,
    variables: input.variables ?? {},
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeInboxItem(item);
  log.info("inbox.delivered", { userId: input.userId, id: item.id });
  return item;
}

export function getInboxItemById(userId: string, itemId: string): InboxItem | null {
  return getInboxItem(userId, itemId);
}

export function queryInbox(query: InboxQuery): InboxResult {
  let items = getInboxItems(query.userId);
  if (query.status) items = items.filter(i => i.status === query.status);
  if (query.category) items = items.filter(i => i.category === query.category);
  if (query.priority) items = items.filter(i => i.priority === query.priority);
  if (query.searchText) {
    const q = query.searchText.toLowerCase();
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)
    );
  }
  // Exclude deleted
  items = items.filter(i => i.status !== "deleted");
  const total = items.length;
  const unreadCount = items.filter(i => i.status === "unread").length;
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 50;
  const paged = items.slice(offset, offset + limit);
  return {
    items: paged, total, unreadCount,
    hasMore: offset + limit < total,
  };
}

export function getInboxSummary(userId: string): {
  total: number; unread: number; read: number;
  archived: number; pinned: number; dismissed: number;
} {
  const items = getInboxItems(userId).filter(i => i.status !== "deleted");
  return {
    total: items.length,
    unread: items.filter(i => i.status === "unread").length,
    read: items.filter(i => i.status === "read").length,
    archived: items.filter(i => i.status === "archived").length,
    pinned: items.filter(i => i.status === "pinned").length,
    dismissed: items.filter(i => i.status === "dismissed").length,
  };
}

const VALID_INBOX_TRANSITIONS: Record<InboxItemStatus, InboxItemStatus[]> = {
  unread: ["read", "archived", "dismissed", "pinned", "deleted", "expired"],
  read: ["archived", "dismissed", "pinned", "deleted", "unread"],
  archived: ["deleted", "read", "unread"],
  dismissed: ["deleted", "read"],
  pinned: ["read", "archived", "dismissed", "deleted"],
  expired: ["deleted"],
  deleted: [],
};

export function canTransitionInbox(from: InboxItemStatus, to: InboxItemStatus): boolean {
  return VALID_INBOX_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionInboxItem(userId: string, itemId: string, to: InboxItemStatus): InboxItem | null {
  const item = getInboxItem(userId, itemId);
  if (!item) return null;
  if (!canTransitionInbox(item.status, to)) return null;
  const now = new Date().toISOString();
  item.status = to;
  if (to === "read" && !item.readAt) item.readAt = now;
  if (to === "archived") item.archivedAt = now;
  if (to === "dismissed") item.dismissedAt = now;
  if (to === "pinned") item.pinnedAt = now;
  if (to === "expired" && !item.expiredAt) item.expiredAt = now;
  if (to === "deleted") item.deletedAt = now;
  updateInboxItem(item);
  if (to === "read") publishNotificationEvent("NotificationRead", item.userId, { itemId: item.id, correlationId: item.correlationId });
  if (to === "dismissed") publishNotificationEvent("NotificationDismissed", item.userId, { itemId: item.id, correlationId: item.correlationId });
  if (to === "archived") publishNotificationEvent("NotificationArchived", item.userId, { itemId: item.id, correlationId: item.correlationId });
  if (to === "pinned") publishNotificationEvent("NotificationPinned", item.userId, { itemId: item.id, correlationId: item.correlationId });
  return item;
}

export function markInboxItemRead(userId: string, itemId: string): InboxItem | null {
  return transitionInboxItem(userId, itemId, "read");
}
export function markInboxItemArchived(userId: string, itemId: string): InboxItem | null {
  return transitionInboxItem(userId, itemId, "archived");
}
export function markInboxItemDismissed(userId: string, itemId: string): InboxItem | null {
  return transitionInboxItem(userId, itemId, "dismissed");
}
export function pinInboxItem(userId: string, itemId: string): InboxItem | null {
  return transitionInboxItem(userId, itemId, "pinned");
}
export function deleteInboxItem(userId: string, itemId: string): InboxItem | null {
  return transitionInboxItem(userId, itemId, "deleted");
}

export function markAllRead(userId: string): number {
  const items = getInboxItems(userId).filter(i => i.status === "unread");
  let count = 0;
  for (const item of items) {
    if (transitionInboxItem(userId, item.id, "read")) count += 1;
  }
  return count;
}

export function clearInbox(userId: string): number {
  const items = getInboxItems(userId).filter(i => i.status !== "deleted");
  for (const item of items) transitionInboxItem(userId, item.id, "deleted");
  publishNotificationEvent("InboxCleared", userId, { userId, count: items.length });
  return items.length;
}

export function expireOldItems(userId: string, now: number = Date.now()): number {
  const items = getInboxItems(userId).filter(i =>
    i.expiredAt && new Date(i.expiredAt).getTime() < now && i.status !== "expired" && i.status !== "deleted"
  );
  for (const item of items) transitionInboxItem(userId, item.id, "expired");
  return items.length;
}

export function supportsAllInboxStatuses(): InboxItemStatus[] {
  return ["unread", "read", "archived", "dismissed", "pinned", "expired", "deleted"];
}

// ===== System 6 — Real-Time Notifications =====

export function enqueueRealtime(input: {
  userId: string; registryKey: string;
  priority: NotificationPriority;
  payload: Record<string, unknown>;
  channels: string[];
  deduplicationKey?: string | null;
  groupKey?: string | null;
  correlationId?: string;
}): RealtimeNotification {
  // Deduplication: if dedup key exists and recent, collapse
  if (input.deduplicationKey) {
    const existing = getRealtimeByDedupKey(input.deduplicationKey);
    if (existing && (existing.status === "queued" || existing.status === "dispatched")) {
      existing.collapseCount += 1;
      storeRealtime(existing);
      log.info("realtime.collapsed", { id: existing.id, count: existing.collapseCount });
      return existing;
    }
  }
  const now = new Date().toISOString();
  const n: RealtimeNotification = {
    id: randomUUID(), userId: input.userId, registryKey: input.registryKey,
    priority: input.priority, payload: input.payload,
    channels: input.channels as never,
    status: "queued",
    deduplicationKey: input.deduplicationKey ?? null,
    groupKey: input.groupKey ?? null,
    queuedAt: now, dispatchedAt: null,
    deliveredAt: null, failedAt: null, failureReason: null,
    attemptCount: 0, collapseCount: 0,
    correlationId: input.correlationId ?? randomUUID(),
  };
  storeRealtime(n);
  log.info("realtime.queued", { id: n.id, priority: n.priority });
  return n;
}

export function getRealtimeById(id: string): RealtimeNotification | null { return getRealtime(id); }

export function listRealtime(status?: RealtimeQueueStatus, userId?: string): RealtimeNotification[] {
  let all = getAllRealtime();
  if (status) all = all.filter(n => n.status === status);
  if (userId) all = all.filter(n => n.userId === userId);
  return all;
}

export function dispatchRealtime(id: string): RealtimeNotification | null {
  const n = getRealtime(id);
  if (!n) return null;
  if (n.status !== "queued") return null;
  n.status = "dispatched"; n.dispatchedAt = new Date().toISOString();
  n.attemptCount += 1;
  storeRealtime(n);
  return n;
}

export function markRealtimeDelivered(id: string): RealtimeNotification | null {
  const n = getRealtime(id);
  if (!n) return null;
  if (n.status !== "dispatched") return null;
  n.status = "delivered"; n.deliveredAt = new Date().toISOString();
  storeRealtime(n);
  publishNotificationEvent("NotificationDelivered", n.userId, {
    notificationId: n.id, correlationId: n.correlationId,
  });
  return n;
}

export function markRealtimeFailed(id: string, reason: string): RealtimeNotification | null {
  const n = getRealtime(id);
  if (!n) return null;
  if (n.status === "delivered" || n.status === "dropped") return null;
  n.status = "failed"; n.failedAt = new Date().toISOString();
  n.failureReason = reason;
  storeRealtime(n);
  publishNotificationEvent("NotificationFailed", n.userId, {
    notificationId: n.id, reason, correlationId: n.correlationId,
  });
  return n;
}

export function dropRealtime(id: string): RealtimeNotification | null {
  const n = getRealtime(id);
  if (!n) return null;
  if (n.status === "delivered") return null;
  n.status = "dropped";
  storeRealtime(n);
  return n;
}

export function retryRealtime(id: string): RealtimeNotification | null {
  const n = getRealtime(id);
  if (!n) return null;
  if (n.status !== "failed") return null;
  n.status = "queued"; n.failedAt = null; n.failureReason = null;
  storeRealtime(n);
  return n;
}

export function collapseGroup(groupKey: string): number {
  const items = getRealtimeByGroupKey(groupKey).filter(n => n.status === "queued");
  if (items.length === 0) return 0;
  // Keep the first, collapse others
  const [first, ...rest] = items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
  for (const n of rest) {
    first.collapseCount += 1;
    n.status = "collapsed";
    storeRealtime(n);
  }
  storeRealtime(first);
  return rest.length;
}

export function generateRealtimeStats(): RealtimeQueueStats {
  const all = getAllRealtime();
  const byPriority: Record<NotificationPriority, number> = {
    critical: 0, high: 0, medium: 0, low: 0, informational: 0,
  };
  let totalQueued = 0, totalDispatched = 0, totalDelivered = 0, totalFailed = 0, totalDropped = 0, totalCollapsed = 0;
  let totalLatency = 0; let latencyCount = 0;
  for (const n of all) {
    byPriority[n.priority] += 1;
    if (n.status === "queued") totalQueued += 1;
    if (n.status === "dispatched") totalDispatched += 1;
    if (n.status === "delivered") {
      totalDelivered += 1;
      if (n.dispatchedAt && n.deliveredAt) {
        totalLatency += new Date(n.deliveredAt).getTime() - new Date(n.dispatchedAt).getTime();
        latencyCount += 1;
      }
    }
    if (n.status === "failed") totalFailed += 1;
    if (n.status === "dropped") totalDropped += 1;
    if (n.status === "collapsed") totalCollapsed += 1;
  }
  return {
    totalQueued, totalDispatched, totalDelivered, totalFailed, totalDropped, totalCollapsed,
    avgLatencyMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
    byPriority,
  };
}

export function supportsAllRealtimeStatuses(): RealtimeQueueStatus[] {
  return ["queued", "dispatched", "delivered", "failed", "dropped", "collapsed"];
}
