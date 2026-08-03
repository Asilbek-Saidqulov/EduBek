/** Systems 11, 12 — Notification Analytics + Dashboard. */
import { getLogger } from "@/lib/logger";
import {
  getAllInboxItems, getAllRealtime, getAllAnnouncements,
  getAllSystemMessages, getAllTemplates, getAllChannels,
  getAllSchedules, getAllRoutingRules,
} from "./repository";
import type {
  NotificationAnalytics, NotificationDashboard,
  NotificationCategory, NotificationPriority, DeliveryChannelId, DeliveryChannelStatus,
} from "./types";
import { isNotificationsSubscribed, getBridgeProcessedCount } from "./event-bus-bridge";

const log = getLogger("notifications.analytics");

// ===== System 11 — Notification Analytics =====

export function generateNotificationAnalytics(): NotificationAnalytics {
  const inboxItems = getAllInboxItems().filter(i => i.status !== "deleted");
  const realtime = getAllRealtime();
  const total = inboxItems.length;
  const delivered = realtime.filter(n => n.status === "delivered").length;
  const failed = realtime.filter(n => n.status === "failed").length;
  const pending = realtime.filter(n => n.status === "queued" || n.status === "dispatched").length;
  const readCount = inboxItems.filter(i => i.status === "read" || i.archivedAt || i.dismissedAt || i.pinnedAt).length;
  const dismissCount = inboxItems.filter(i => i.status === "dismissed").length;
  const archiveCount = inboxItems.filter(i => i.status === "archived").length;
  const pinCount = inboxItems.filter(i => i.status === "pinned").length;
  // Click count is approximate — tracks items that were read AND had a deepLink
  const clickCount = inboxItems.filter(i => (i.status === "read" || i.status === "archived") && i.deepLink).length;
  const byChannel: Record<DeliveryChannelId, { sent: number; delivered: number; failed: number }> = {
    in_app: { sent: 0, delivered: 0, failed: 0 },
    push: { sent: 0, delivered: 0, failed: 0 },
    email: { sent: 0, delivered: 0, failed: 0 },
    sms: { sent: 0, delivered: 0, failed: 0 },
    organization_announcement: { sent: 0, delivered: 0, failed: 0 },
    broadcast_overlay: { sent: 0, delivered: 0, failed: 0 },
    webhook: { sent: 0, delivered: 0, failed: 0 },
    developer_callback: { sent: 0, delivered: 0, failed: 0 },
  };
  for (const n of realtime) {
    for (const ch of n.channels) {
      if (byChannel[ch]) {
        byChannel[ch].sent += 1;
        if (n.status === "delivered") byChannel[ch].delivered += 1;
        if (n.status === "failed") byChannel[ch].failed += 1;
      }
    }
  }
  const byCategory: Record<NotificationCategory, { sent: number; delivered: number; read: number }> = {
    system: { sent: 0, delivered: 0, read: 0 }, social: { sent: 0, delivered: 0, read: 0 },
    competitive: { sent: 0, delivered: 0, read: 0 }, progression: { sent: 0, delivered: 0, read: 0 },
    commerce: { sent: 0, delivered: 0, read: 0 }, liveops: { sent: 0, delivered: 0, read: 0 },
    administration: { sent: 0, delivered: 0, read: 0 }, achievement: { sent: 0, delivered: 0, read: 0 },
    maintenance: { sent: 0, delivered: 0, read: 0 }, emergency: { sent: 0, delivered: 0, read: 0 },
    tournament: { sent: 0, delivered: 0, read: 0 }, campaign: { sent: 0, delivered: 0, read: 0 },
    season: { sent: 0, delivered: 0, read: 0 }, reminder: { sent: 0, delivered: 0, read: 0 },
    digest: { sent: 0, delivered: 0, read: 0 },
  };
  for (const item of inboxItems) {
    if (byCategory[item.category]) {
      byCategory[item.category].sent += 1;
      if (item.status !== "unread") byCategory[item.category].delivered += 1;
      if (item.status === "read" || item.readAt) byCategory[item.category].read += 1;
    }
  }
  const byPriority: Record<NotificationPriority, { sent: number; delivered: number }> = {
    critical: { sent: 0, delivered: 0 }, high: { sent: 0, delivered: 0 },
    medium: { sent: 0, delivered: 0 }, low: { sent: 0, delivered: 0 },
    informational: { sent: 0, delivered: 0 },
  };
  for (const item of inboxItems) {
    byPriority[item.priority].sent += 1;
    if (item.status !== "unread" && item.status !== "deleted") byPriority[item.priority].delivered += 1;
  }
  // Latency
  let totalLatency = 0, latencyCount = 0;
  const latencies: number[] = [];
  for (const n of realtime) {
    if (n.dispatchedAt && n.deliveredAt) {
      const l = new Date(n.deliveredAt).getTime() - new Date(n.dispatchedAt).getTime();
      totalLatency += l; latencyCount += 1;
      latencies.push(l);
    }
  }
  latencies.sort((a, b) => a - b);
  const p = (pct: number) => latencies.length > 0 ? latencies[Math.floor(latencies.length * pct)] ?? 0 : 0;
  // Failures
  const byReason: Record<string, number> = {};
  for (const n of realtime.filter(n => n.failureReason)) {
    byReason[n.failureReason!] = (byReason[n.failureReason!] ?? 0) + 1;
  }
  // Digest
  const messages = getAllSystemMessages();
  const digests = messages.filter(m => m.type === "digest");
  return {
    delivery: {
      total, delivered, failed, pending,
      deliveryRate: total > 0 ? delivered / total : 0,
    },
    engagement: {
      readCount,
      readRate: total > 0 ? readCount / total : 0,
      clickCount,
      clickRate: total > 0 ? clickCount / total : 0,
      dismissCount,
      dismissRate: total > 0 ? dismissCount / total : 0,
      archiveCount,
      pinCount,
    },
    latency: {
      avgDispatchMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
      avgDeliveryMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
      p50Ms: p(0.5), p95Ms: p(0.95), p99Ms: p(0.99),
    },
    byChannel, byCategory, byPriority,
    failures: {
      total: failed,
      byReason,
    },
    digest: {
      generated: digests.length,
      delivered: digests.filter(d => d.deliveredAt).length,
      opened: 0, // not tracked
    },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 12 — Notification Dashboard =====

export function generateNotificationDashboard(): NotificationDashboard {
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const realtime = getAllRealtime();
  const inbox = getAllInboxItems();
  const templates = getAllTemplates();
  const channels = getAllChannels();
  const schedules = getAllSchedules();
  // Pending
  const pending = realtime.filter(n => n.status === "queued").length;
  const delivered24h = realtime.filter(n => n.deliveredAt && now - new Date(n.deliveredAt).getTime() < day).length;
  const failed24h = realtime.filter(n => n.failedAt && now - new Date(n.failedAt).getTime() < day).length;
  const queued = realtime.filter(n => n.status === "queued").length;
  const scheduled = schedules.filter(s => s.status === "pending").length;
  // Channels sent24h
  const channelsArr = channels.map(c => {
    let sent24h = 0;
    for (const n of realtime) {
      if (n.deliveredAt && now - new Date(n.deliveredAt).getTime() < day && n.channels.includes(c.id)) sent24h += 1;
    }
    return { id: c.id, status: c.status, sent24h };
  });
  // Top categories
  const catCount: Record<string, number> = {};
  for (const item of inbox) catCount[item.category] = (catCount[item.category] ?? 0) + 1;
  const topCategories = Object.entries(catCount)
    .map(([category, count]) => ({ category: category as NotificationCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  // Top failures
  const failReasons: Record<string, number> = {};
  for (const n of realtime.filter(n => n.failureReason)) {
    failReasons[n.failureReason!] = (failReasons[n.failureReason!] ?? 0) + 1;
  }
  const topFailures = Object.entries(failReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  // Health
  const oldestQueued = realtime.filter(n => n.status === "queued").sort((a, b) => a.queuedAt.localeCompare(b.queuedAt))[0];
  const overdue = schedules.filter(s => s.status === "pending" && now - new Date(s.scheduledAt).getTime() > 5 * 60 * 1000).length;
  return {
    pending, delivered24h, failed24h, queued, scheduled,
    templates: {
      total: templates.length,
      active: templates.filter(t => t.active).length,
      draft: templates.filter(t => !t.active).length,
    },
    channels: channelsArr,
    health: {
      bridge: { subscribed: isNotificationsSubscribed(), processedCount: getBridgeProcessedCount() },
      queue: {
        size: queued,
        oldestItemAgeMs: oldestQueued ? now - new Date(oldestQueued.queuedAt).getTime() : 0,
      },
      scheduler: { pending: scheduled, overdue },
    },
    topCategories,
    topFailures,
    updatedAt: new Date().toISOString(),
  };
}

export function getNotificationStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } {
  return {
    operational: true, systems: 15,
    bridgeSubscribed: isNotificationsSubscribed(),
    updatedAt: new Date().toISOString(),
  };
}
