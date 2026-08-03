/**
 * EduBek — Product Analytics.
 *
 * Phase 5D.5 System 12: Measure feature adoption, drop-offs, workflow
 * completion, time saved, AI assistance acceptance, dashboard usage,
 * navigation paths, and friction points. Generate optimization
 * recommendations.
 *
 * Analytics events are recorded via `trackEvent` and aggregated by this
 * module. The module reuses Platform Orchestrator's workflow execution
 * data for completion rates and AI invocation data for assistance
 * acceptance.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type { ProductAnalyticsReport } from "./types";

const log = getLogger("product-analytics");

// ===========================================================================
// Public API — event tracking
// ===========================================================================

export async function trackEvent(input: {
  userId?: string | null;
  eventType: string;
  feature?: string;
  location?: string;
  metadata?: Record<string, unknown>;
  frictionScore?: number;
  durationMs?: number;
}): Promise<void> {
  await repo.createAnalyticsEvent(input);
  log.debug("analytics.tracked", { eventType: input.eventType, feature: input.feature });
}

// ===========================================================================
// Public API — report generation
// ===========================================================================

export async function generateAnalyticsReport(opts: { since?: Date } = {}): Promise<ProductAnalyticsReport> {
  const since = opts.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const [featureAdoption, dropOffs, workflowCompletion, timeSavedMinutes,
    aiAssistanceAcceptance, dashboardUsage, navigationPaths, frictionPoints] = await Promise.all([
    computeFeatureAdoption(since),
    computeDropOffs(since),
    computeWorkflowCompletion(since),
    computeTimeSaved(since),
    computeAIAssistanceAcceptance(since),
    computeDashboardUsage(since),
    computeNavigationPaths(since),
    computeFrictionPoints(since),
  ]);

  const recommendations = generateRecommendations({
    featureAdoption, dropOffs, workflowCompletion, aiAssistanceAcceptance, frictionPoints,
  });

  return {
    featureAdoption,
    dropOffs,
    workflowCompletion,
    timeSavedMinutes,
    aiAssistanceAcceptance,
    dashboardUsage,
    navigationPaths,
    frictionPoints,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Aggregations
// ===========================================================================

async function computeFeatureAdoption(since: Date): Promise<Array<{ feature: string; users: number; percent: number }>> {
  // Count distinct users per feature in the analytics events
  const events = await repo.listAnalyticsEvents({ since, limit: 5000 }).catch(() => []);
  const featureUsers = new Map<string, Set<string>>();
  let totalUsers = new Set<string>();
  for (const e of events) {
    if (!e.feature || !e.userId) continue;
    if (!featureUsers.has(e.feature)) featureUsers.set(e.feature, new Set());
    featureUsers.get(e.feature)!.add(e.userId);
    totalUsers.add(e.userId);
  }
  // Also pull from actual usage tables for a more accurate picture
  const aiUsers = await db.orchestratorAIInvocation.findMany({
    where: { createdAt: { gte: since } },
    select: { userId: true },
    distinct: ["userId"],
  }).catch(() => []);
  if (aiUsers.length > 0) {
    const set = new Set(aiUsers.map(u => u.userId).filter(Boolean) as string[]);
    featureUsers.set("ai_workspace", set);
    for (const u of set) totalUsers.add(u);
  }
  const total = totalUsers.size || 1;
  return Array.from(featureUsers.entries())
    .map(([feature, users]) => ({ feature, users: users.size, percent: Math.round((users.size / total) * 100) }))
    .sort((a, b) => b.users - a.users);
}

async function computeDropOffs(since: Date): Promise<Array<{ journey: string; step: string; dropOffRate: number }>> {
  // Drop-offs = journey steps that are started but never completed
  const journeys = await db.productJourney.findMany({
    where: { updatedAt: { gte: since } },
    select: { kind: true, steps: true, currentStepIndex: true },
  }).catch(() => []);
  const dropOffs = new Map<string, { started: number; dropped: number }>();
  for (const j of journeys) {
    try {
      const steps = JSON.parse(j.steps) as Array<{ label: string; status: string }>;
      for (let i = 0; i < steps.length; i++) {
        const key = `${j.kind}:${steps[i].label}`;
        const entry = dropOffs.get(key) ?? { started: 0, dropped: 0 };
        entry.started += 1;
        // Dropped if this step is past the current step index and not completed
        if (i < j.currentStepIndex && steps[i].status !== "completed") {
          entry.dropped += 1;
        } else if (i === j.currentStepIndex && steps[i].status !== "completed") {
          entry.dropped += 1;
        }
        dropOffs.set(key, entry);
      }
    } catch { /* noop */ }
  }
  return Array.from(dropOffs.entries())
    .map(([key, v]) => {
      const [journey, ...stepParts] = key.split(":");
      return {
        journey,
        step: stepParts.join(":"),
        dropOffRate: v.started === 0 ? 0 : Math.round((v.dropped / v.started) * 100) / 100,
      };
    })
    .filter(d => d.dropOffRate > 0)
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, 10);
}

async function computeWorkflowCompletion(since: Date): Promise<Array<{ workflow: string; started: number; completed: number; completionRate: number }>> {
  const rows = await db.orchestratorWorkflowExecution.findMany({
    where: { startedAt: { gte: since } },
    select: { workflowId: true, status: true },
  }).catch(() => []);
  const byWorkflow = new Map<string, { started: number; completed: number }>();
  for (const r of rows) {
    const entry = byWorkflow.get(r.workflowId) ?? { started: 0, completed: 0 };
    entry.started += 1;
    if (r.status === "completed") entry.completed += 1;
    byWorkflow.set(r.workflowId, entry);
  }
  return Array.from(byWorkflow.entries())
    .map(([workflow, v]) => ({
      workflow, started: v.started, completed: v.completed,
      completionRate: v.started === 0 ? 0 : Math.round((v.completed / v.started) * 100) / 100,
    }))
    .sort((a, b) => b.started - a.started);
}

async function computeTimeSaved(since: Date): Promise<number> {
  // Estimate time saved = AI invocations × average time saved per invocation (5 minutes)
  const aiCount = await db.orchestratorAIInvocation.count({
    where: { createdAt: { gte: since }, status: "succeeded" },
  }).catch(() => 0);
  return aiCount * 5; // 5 minutes saved per AI call (rough estimate)
}

async function computeAIAssistanceAcceptance(since: Date): Promise<number> {
  // Acceptance = succeeded / total AI invocations
  const [succeeded, total] = await Promise.all([
    db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since }, status: "succeeded" } }).catch(() => 0),
    db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
  ]);
  return total === 0 ? 0 : Math.round((succeeded / total) * 100) / 100;
}

async function computeDashboardUsage(since: Date): Promise<Array<{ widget: string; views: number; avgTimeSeconds: number }>> {
  const events = await repo.listAnalyticsEvents({
    eventType: "widget_view", since, limit: 5000,
  }).catch(() => []);
  const widgetStats = new Map<string, { views: number; totalDurationMs: number }>();
  for (const e of events) {
    const feature = e.feature ?? "unknown";
    const entry = widgetStats.get(feature) ?? { views: 0, totalDurationMs: 0 };
    entry.views += 1;
    entry.totalDurationMs += e.durationMs ?? 0;
    widgetStats.set(feature, entry);
  }
  return Array.from(widgetStats.entries())
    .map(([widget, v]) => ({
      widget, views: v.views,
      avgTimeSeconds: v.views === 0 ? 0 : Math.round((v.totalDurationMs / v.views) / 1000),
    }))
    .sort((a, b) => b.views - a.views);
}

async function computeNavigationPaths(since: Date): Promise<Array<{ from: string; to: string; count: number }>> {
  // Reconstruct navigation paths from analytics events with location metadata
  const events = await repo.listAnalyticsEvents({
    eventType: "page_view", since, limit: 5000,
  }).catch(() => []);
  // Group by user, then build (from → to) pairs
  const byUser = new Map<string, Array<string>>();
  for (const e of events) {
    if (!e.userId || !e.location) continue;
    if (!byUser.has(e.userId)) byUser.set(e.userId, []);
    byUser.get(e.userId)!.push(e.location);
  }
  const pathCounts = new Map<string, number>();
  for (const locations of byUser.values()) {
    for (let i = 1; i < locations.length; i++) {
      const key = `${locations[i - 1]}→${locations[i]}`;
      pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(pathCounts.entries())
    .map(([key, count]) => {
      const [from, to] = key.split("→");
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function computeFrictionPoints(since: Date): Promise<Array<{ location: string; severity: number; description: string }>> {
  // Friction = events with high frictionScore or long duration
  const events = await repo.listAnalyticsEvents({ since, limit: 5000 }).catch(() => []);
  const frictionByLocation = new Map<string, { count: number; totalScore: number }>();
  for (const e of events) {
    if (!e.location || e.frictionScore === 0) continue;
    const entry = frictionByLocation.get(e.location) ?? { count: 0, totalScore: 0 };
    entry.count += 1;
    entry.totalScore += e.frictionScore;
    frictionByLocation.set(e.location, entry);
  }
  return Array.from(frictionByLocation.entries())
    .map(([location, v]) => ({
      location,
      severity: Math.min(100, Math.round(v.totalScore / v.count)),
      description: `${v.count} friction event(s) at ${location} (avg score ${(v.totalScore / v.count).toFixed(1)})`,
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 10);
}

function generateRecommendations(data: {
  featureAdoption: Array<{ feature: string; users: number; percent: number }>;
  dropOffs: Array<{ journey: string; step: string; dropOffRate: number }>;
  workflowCompletion: Array<{ workflow: string; started: number; completed: number; completionRate: number }>;
  aiAssistanceAcceptance: number;
  frictionPoints: Array<{ location: string; severity: number; description: string }>;
}): Array<{ recommendation: string; impact: number; effort: number }> {
  const recs: Array<{ recommendation: string; impact: number; effort: number }> = [];
  // Low AI acceptance → suggest improving prompt quality
  if (data.aiAssistanceAcceptance < 0.7 && data.aiAssistanceAcceptance > 0) {
    recs.push({
      recommendation: "Improve AI prompt quality — acceptance rate is below 70%",
      impact: 80, effort: 40,
    });
  }
  // High drop-off steps → investigate UX
  for (const d of data.dropOffs.slice(0, 3)) {
    if (d.dropOffRate > 0.3) {
      recs.push({
        recommendation: `Investigate drop-off at "${d.step}" in ${d.journey} journey (${Math.round(d.dropOffRate * 100)}% drop-off)`,
        impact: 70, effort: 30,
      });
    }
  }
  // Low workflow completion → check for failures
  for (const w of data.workflowCompletion.slice(0, 3)) {
    if (w.completionRate < 0.8 && w.started > 5) {
      recs.push({
        recommendation: `Investigate low completion rate for workflow ${w.workflow} (${Math.round(w.completionRate * 100)}%)`,
        impact: 65, effort: 25,
      });
    }
  }
  // High-severity friction points
  for (const f of data.frictionPoints.slice(0, 2)) {
    if (f.severity > 50) {
      recs.push({
        recommendation: `Reduce friction at ${f.location} (severity ${f.severity})`,
        impact: 60, effort: 35,
      });
    }
  }
  // Low feature adoption
  for (const f of data.featureAdoption.slice(-3)) {
    if (f.percent < 10) {
      recs.push({
        recommendation: `Promote ${f.feature} feature — only ${f.percent}% of users use it`,
        impact: 50, effort: 20,
      });
    }
  }
  return recs.sort((a, b) => (b.impact - b.effort) - (a.impact - a.effort));
}
