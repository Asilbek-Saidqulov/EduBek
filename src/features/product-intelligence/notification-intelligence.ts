/**
 * EduBek — Notification Intelligence.
 *
 * Phase 5D.5 System 8: Instead of sending every notification, cluster,
 * deduplicate, prioritize, summarize, delay, and merge notifications
 * intelligently.
 *
 * Reuses existing `UserNotification` rows as input and produces
 * `NotificationCluster` rows as output. The frontend reads clusters
 * instead of individual notifications.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type { NotificationCluster, NotificationIntelligenceReport } from "./types";

const log = getLogger("notification-intelligence");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateNotificationReport(userId: string): Promise<NotificationIntelligenceReport> {
  // Fetch recent unread notifications
  const notifications = await db.userNotification.findMany({
    where: { userId, readAt: null, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    take: 100,
  }).catch(() => []);

  if (notifications.length === 0) {
    return { clusters: [], deduplicatedCount: 0, delayedCount: 0, totalConsidered: 0, generatedAt: new Date().toISOString() };
  }

  // 1. Deduplicate — drop notifications with the same type + title within 5 minutes
  const deduped = deduplicate(notifications);
  const deduplicatedCount = notifications.length - deduped.length;

  // 2. Cluster by type — group related notifications into a single summary
  const grouped = groupByType(deduped);

  // 3. Build clusters
  const clusters: NotificationCluster[] = [];
  let delayedCount = 0;
  for (const [type, group] of Object.entries(grouped)) {
    if (group.length === 1) {
      // Single notification — deliver immediately
      const n = group[0];
      clusters.push({
        id: `cluster:${n.id}`,
        title: n.title,
        body: n.body ?? "",
        notificationIds: [n.id],
        priority: computePriority(n.type),
        kind: n.type,
        delivery: "now",
        deliverAt: new Date().toISOString(),
        count: 1,
      });
    } else {
      // Multiple notifications of the same type — summarize and possibly delay
      const shouldDelay = shouldDelayBatch(type, group);
      if (shouldDelay) delayedCount += group.length;
      clusters.push({
        id: `cluster:${type}:${group[0].id}`,
        title: summarizeTitle(type, group.length),
        body: summarizeBody(group),
        notificationIds: group.map(n => n.id),
        priority: computeBatchPriority(type, group.length),
        kind: type,
        delivery: shouldDelay ? "delayed" : "merged",
        deliverAt: shouldDelay
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // delay by 30 minutes
          : new Date().toISOString(),
        count: group.length,
      });
    }
  }

  // 4. Sort by priority desc
  clusters.sort((a, b) => b.priority - a.priority);

  // 5. Persist clusters (best-effort)
  for (const cluster of clusters.slice(0, 20)) {
    await repo.createNotificationCluster({
      userId,
      title: cluster.title,
      body: cluster.body,
      notificationIds: cluster.notificationIds,
      priority: cluster.priority,
      kind: cluster.kind,
      delivery: cluster.delivery,
      deliverAt: new Date(cluster.deliverAt),
      count: cluster.count,
    }).catch(() => { /* ignore dupes */ });
  }

  log.info("notification.report_generated", { userId, totalConsidered: notifications.length, clusters: clusters.length, deduplicatedCount, delayedCount });
  return {
    clusters,
    deduplicatedCount,
    delayedCount,
    totalConsidered: notifications.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function listPendingClusters(userId: string): Promise<NotificationCluster[]> {
  const rows = await repo.listPendingClusters(userId);
  return rows.map(r => ({
    id: r.id, title: r.title, body: r.body,
    notificationIds: repo.safeParse(r.notificationIds, []),
    priority: r.priority, kind: r.kind, delivery: r.delivery as NotificationCluster["delivery"],
    deliverAt: r.deliverAt.toISOString(), count: r.count,
  }));
}

export async function markClusterDelivered(id: string): Promise<void> {
  await repo.markClusterDelivered(id);
}

// ===========================================================================
// Helpers
// ===========================================================================

type NotificationRow = { id: string; type: string; title: string; body: string | null; createdAt: Date };

export function deduplicate(notifications: NotificationRow[]): NotificationRow[] {
  const seen = new Map<string, NotificationRow>();
  for (const n of notifications) {
    const key = `${n.type}:${n.title}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, n);
    } else {
      // Keep the more recent one
      if (n.createdAt > existing.createdAt) seen.set(key, n);
    }
  }
  return Array.from(seen.values());
}

export function groupByType(notifications: NotificationRow[]): Record<string, NotificationRow[]> {
  const groups: Record<string, NotificationRow[]> = {};
  for (const n of notifications) {
    if (!groups[n.type]) groups[n.type] = [];
    groups[n.type].push(n);
  }
  return groups;
}

export function computePriority(type: string): number {
  const highPriorityTypes = ["assessment_submitted", "grading_required", "deadline", "alert", "incident"];
  const mediumPriorityTypes = ["review", "purchase", "payout", "system"];
  if (highPriorityTypes.includes(type)) return 85;
  if (mediumPriorityTypes.includes(type)) return 60;
  return 40;
}

export function computeBatchPriority(type: string, count: number): number {
  const base = computePriority(type);
  // Boost priority for larger batches
  return Math.min(100, base + Math.min(15, Math.floor(count / 3) * 5));
}

export function shouldDelayBatch(type: string, group: NotificationRow[]): boolean {
  // Delay low-priority batches (3+ notifications) by 30 minutes
  const lowPriorityTypes = ["system", "ai_suggestion", "recommendation"];
  if (lowPriorityTypes.includes(type) && group.length >= 3) return true;
  return false;
}

export function summarizeTitle(type: string, count: number): string {
  const labels: Record<string, string> = {
    assessment_submitted: "New submissions",
    grading_required: "Grading required",
    review: "New reviews",
    purchase: "New purchases",
    payout: "Payout updates",
    system: "System updates",
    deadline: "Deadline reminders",
    alert: "Alerts",
    ai_suggestion: "AI suggestions",
    recommendation: "Recommendations",
  };
  const label = labels[type] ?? "Notifications";
  return `${count} ${label}`;
}

export function summarizeBody(group: NotificationRow[]): string {
  if (group.length === 0) return "";
  // Take the most recent notification's body and append a count
  const latest = group[0];
  if (group.length === 1) return latest.body ?? "";
  return `${latest.body ?? ""} (+${group.length - 1} more)`;
}
