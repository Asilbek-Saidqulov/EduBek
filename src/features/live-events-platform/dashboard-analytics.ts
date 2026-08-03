/** Systems 8, 9, 15 — LiveOps Dashboard, Event Analytics, Developer Integration. */
import { getLogger } from "@/lib/logger";
import { getAllEvents, getAllCampaigns, getParticipations, getAllObjectives, getAllRewardMappings } from "./repository";
import type { LiveOpsDashboard, EventAnalytics, LiveOpsDeveloperIntegration } from "./types";

const log = getLogger("live-events.dashboard");

// ===== System 8 — Live Operations Dashboard =====
export function generateDashboard(): LiveOpsDashboard {
  const events = getAllEvents();
  const campaigns = getAllCampaigns();
  const running = events.filter(e => e.status === "running");
  const upcoming = events.filter(e => e.status === "scheduled");
  const completed = events.filter(e => e.status === "completed");
  const totalParticipants = events.reduce((s, e) => s + e.enrolledCount, 0);
  const totalCompleted = events.reduce((s, e) => s + e.completedCount, 0);
  const totalAbandoned = events.reduce((s, e) => s + e.abandonedCount, 0);
  const completionRate = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) / 100 : 0;
  const conversionRate = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) / 100 : 0;
  const dropoutRate = totalParticipants > 0 ? Math.round((totalAbandoned / totalParticipants) * 100) / 100 : 0;
  const topCampaigns = campaigns.slice(0, 5).map(c => ({
    campaignId: c.id, name: c.name,
    participation: events.filter(e => e.campaignId === c.id).reduce((s, e) => s + e.enrolledCount, 0),
  })).sort((a, b) => b.participation - a.participation);
  const teacherAdoption = events.filter(e => e.type === "organization" || e.type === "classroom").length;
  const orgAdoption = events.filter(e => e.organizationId !== null).length;
  return {
    runningEvents: running.length, upcomingEvents: upcoming.length, completedEvents: completed.length,
    totalParticipants, completionRate, conversionRate, dropoutRate,
    topCampaigns, teacherAdoption, organizationAdoption: orgAdoption,
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 9 — Event Analytics =====
export function generateEventAnalytics(eventId: string): EventAnalytics | null {
  const event = getAllEvents().find(e => e.id === eventId);
  if (!event) return null;
  const participations = getParticipations(eventId);
  const completed = participations.filter(p => p.status === "completed");
  const dropped = participations.filter(p => p.status === "abandoned" || p.status === "expired");
  const completionRate = participations.length > 0 ? Math.round((completed.length / participations.length) * 100) / 100 : 0;
  const dropoutRate = participations.length > 0 ? Math.round((dropped.length / participations.length) * 100) / 100 : 0;
  const completionTimes = completed.filter(p => p.completedAt).map(p => new Date(p.completedAt!).getTime() - new Date(p.enrolledAt).getTime());
  const avgCompletionTime = completionTimes.length > 0 ? Math.round(completionTimes.reduce((s, t) => s + t, 0) / completionTimes.length) : 0;
  const participationByDay: Array<{ date: string; count: number }> = [];
  const dayMap = new Map<string, number>();
  for (const p of participations) {
    const day = p.enrolledAt.split("T")[0];
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  for (const [date, count] of dayMap) participationByDay.push({ date, count });
  const objectiveCompletion: Record<string, number> = {};
  for (const p of participations) {
    for (const [objId, progress] of Object.entries(p.objectivesProgress)) {
      objectiveCompletion[objId] = Math.max(objectiveCompletion[objId] ?? 0, progress);
    }
  }
  return {
    eventId, totalParticipants: participations.length,
    completionRate, averageCompletionTime: avgCompletionTime,
    dropoutRate, peakParticipation: Math.max(0, ...participationByDay.map(d => d.count)),
    participationByDay, objectiveCompletion,
  };
}

// ===== System 15 — Developer Integration =====
export function getDeveloperIntegration(): LiveOpsDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/live-events/registry", method: "GET", description: "List live events", authRequired: true },
      { path: "/api/live-events/campaigns", method: "GET", description: "List campaigns", authRequired: true },
      { path: "/api/live-events/scheduler", method: "GET", description: "List scheduled events", authRequired: true },
      { path: "/api/live-events/templates", method: "GET", description: "List event templates", authRequired: true },
      { path: "/api/live-events/participation", method: "GET", description: "Get participation data", authRequired: true },
      { path: "/api/live-events/objectives", method: "GET", description: "List objectives", authRequired: true },
      { path: "/api/live-events/dashboard", method: "GET", description: "LiveOps dashboard", authRequired: true },
      { path: "/api/live-events/analytics", method: "GET", description: "Event analytics", authRequired: true },
    ],
    eventContracts: [
      "LiveEventStarted", "LiveEventEnded", "CampaignStageCompleted",
      "ObjectiveCompleted", "ParticipationEnrolled", "ParticipationCompleted",
      "FeatureFlagChanged",
    ],
    extensionHooks: [
      { id: "hook_event_started", name: "On Live Event Started", triggerEvent: "LiveEventStarted" },
      { id: "hook_event_ended", name: "On Live Event Ended", triggerEvent: "LiveEventEnded" },
      { id: "hook_objective_completed", name: "On Objective Completed", triggerEvent: "ObjectiveCompleted" },
    ],
    sdkMetadata: { version: "1.0.0", language: "TypeScript", docsUrl: "https://docs.edubek.dev/live-events" },
  };
}
