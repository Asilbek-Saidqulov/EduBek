/**
 * EduBek — Incident Manager (System 7).
 *
 * Generates incident reports with severity, affected systems, probable
 * root cause, affected users, recommended actions, rollback suggestions,
 * communication checklist, and resolution timeline.
 *
 * REUSES Platform Orchestrator's trace spans + Cloud Infrastructure's
 * health snapshots + error spans for incident detection.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  IncidentReport, IncidentSeverity, ReliabilityRecommendation,
} from "./types";

const log = getLogger("incident-manager");

export async function generateIncidentReport(opts: {
  title?: string;
  description?: string;
  affectedSystems?: string[];
  severity?: IncidentSeverity;
} = {}): Promise<IncidentReport> {
  const generatedAt = new Date().toISOString();
  const id = `incident-${randomUUID().slice(0, 8)}`;
  // Gather data to inform the incident
  const [errorSpans, healthSnapshots, aiFailures, webhookDeliveries] = await Promise.all([
    repo.fetchErrorSpans({ limit: 50 }),
    repo.fetchLatestHealthPerSubsystem(),
    repo.fetchAIInvocationFailures({ limit: 20 }),
    repo.fetchWebhookDeliveries({ limit: 20 }),
  ]);
  const severity = opts.severity ?? determineSeverity(errorSpans, healthSnapshots);
  const affectedSystems = opts.affectedSystems ?? determineAffectedSystems(errorSpans, healthSnapshots);
  const probableRootCause = opts.title ?? determineRootCause(errorSpans, healthSnapshots, aiFailures);
  const affectedUserPercent = determineAffectedPercent(severity, affectedSystems);
  const recommendedActions = determineActions(severity, affectedSystems);
  const rollbackSuggestions = determineRollbackSuggestions(affectedSystems);
  const communicationChecklist = buildCommunicationChecklist(severity);
  const resolutionTimeline = buildResolutionTimeline(severity);
  log.info("incident.generated", { id, severity, affectedSystems: affectedSystems.length });
  return {
    id, generatedAt, severity,
    title: opts.title ?? `Incident: ${probableRootCause}`,
    description: opts.description ?? `Automated incident report generated from ${errorSpans.length} error span(s) and ${healthSnapshots.filter(s => s.status !== "healthy").length} unhealthy subsystem(s).`,
    affectedSystems,
    affectedUserPercent,
    probableRootCause,
    recommendedActions,
    rollbackSuggestions,
    communicationChecklist,
    resolutionTimeline,
    status: "detected",
  };
}

function determineSeverity(
  errorSpans: Awaited<ReturnType<typeof repo.fetchErrorSpans>>,
  health: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>,
): IncidentSeverity {
  const downCount = health.filter(s => s.status === "down").length;
  const degradedCount = health.filter(s => s.status === "degraded").length;
  const errorCount = errorSpans.length;
  if (downCount > 0 || errorCount > 50) return "sev1";
  if (degradedCount > 2 || errorCount > 20) return "sev2";
  if (errorCount > 5) return "sev3";
  return "sev4";
}

function determineAffectedSystems(
  errorSpans: Awaited<ReturnType<typeof repo.fetchErrorSpans>>,
  health: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>,
): string[] {
  const systems = new Set<string>();
  for (const s of errorSpans) systems.add(s.module);
  for (const s of health) {
    if (s.status !== "healthy") systems.add(s.subsystem);
  }
  return Array.from(systems).slice(0, 10);
}

function determineRootCause(
  errorSpans: Awaited<ReturnType<typeof repo.fetchErrorSpans>>,
  health: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>,
  aiFailures: Awaited<ReturnType<typeof repo.fetchAIInvocationFailures>>,
): string {
  if (aiFailures.length > 5) return "AI provider is failing — check provider status and circuit breaker state.";
  const downSystem = health.find(s => s.status === "down");
  if (downSystem) return `${downSystem.subsystem} is down — check the subsystem directly.`;
  if (errorSpans.length > 0) {
    const topModule = errorSpans[0].module;
    return `Most errors originate from ${topModule} — inspect recent deployments and logs.`;
  }
  return "Root cause unknown — manual investigation required.";
}

function determineAffectedPercent(severity: IncidentSeverity, affectedSystems: string[]): number {
  if (severity === "sev1") return 100;
  if (severity === "sev2") return Math.min(80, affectedSystems.length * 10);
  if (severity === "sev3") return Math.min(40, affectedSystems.length * 5);
  return Math.min(10, affectedSystems.length * 2);
}

function determineActions(severity: IncidentSeverity, affectedSystems: string[]): Array<{ priority: number; action: string; estimatedTimeMinutes: number }> {
  const actions: Array<{ priority: number; action: string; estimatedTimeMinutes: number }> = [];
  if (severity === "sev1") {
    actions.push({ priority: 1, action: "Acknowledge the incident and page the on-call engineer", estimatedTimeMinutes: 5 });
    actions.push({ priority: 2, action: "Check database connectivity", estimatedTimeMinutes: 5 });
    actions.push({ priority: 3, action: "Check recent deployments and consider rollback", estimatedTimeMinutes: 15 });
    actions.push({ priority: 4, action: "Check infrastructure health (CPU, memory, disk)", estimatedTimeMinutes: 10 });
    actions.push({ priority: 5, action: "Post status page update", estimatedTimeMinutes: 5 });
  } else if (severity === "sev2") {
    actions.push({ priority: 1, action: "Acknowledge the incident", estimatedTimeMinutes: 5 });
    actions.push({ priority: 2, action: `Investigate affected systems: ${affectedSystems.join(", ")}`, estimatedTimeMinutes: 20 });
    actions.push({ priority: 3, action: "Check circuit breaker states", estimatedTimeMinutes: 5 });
    actions.push({ priority: 4, action: "Consider graceful degradation", estimatedTimeMinutes: 10 });
  } else {
    actions.push({ priority: 1, action: "Investigate during the next business hour", estimatedTimeMinutes: 30 });
    actions.push({ priority: 2, action: "Monitor error rate trends", estimatedTimeMinutes: 10 });
  }
  return actions;
}

function determineRollbackSuggestions(affectedSystems: string[]): string[] {
  const suggestions: string[] = [];
  if (affectedSystems.includes("ai-workspace")) {
    suggestions.push("Roll back recent AI provider configuration changes");
    suggestions.push("Revert prompt registry to the previous version");
  }
  if (affectedSystems.includes("database")) {
    suggestions.push("Roll back the latest Prisma migration if schema changed");
  }
  if (affectedSystems.includes("platform-orchestrator")) {
    suggestions.push("Revert the latest platform-orchestrator deployment");
  }
  suggestions.push("Check git history for recent changes to affected modules");
  return suggestions;
}

function buildCommunicationChecklist(severity: IncidentSeverity): string[] {
  const checklist: string[] = [
    "Post initial message in the #incidents Slack channel",
    "Update the public status page",
    "Notify affected customers via email (if SEV1 or SEV2)",
  ];
  if (severity === "sev1") {
    checklist.push("Page the on-call engineer and engineering manager");
    checklist.push("Prepare a customer-facing incident summary within 1 hour");
    checklist.push("Schedule a postmortem within 48 hours");
  }
  if (severity === "sev2") {
    checklist.push("Notify the engineering manager");
    checklist.push("Schedule a postmortem within 1 week");
  }
  return checklist;
}

function buildResolutionTimeline(severity: IncidentSeverity): Array<{ phase: string; estimatedTimeMinutes: number; description: string }> {
  if (severity === "sev1") {
    return [
      { phase: "Detection", estimatedTimeMinutes: 5, description: "Automated monitoring detects the incident" },
      { phase: "Acknowledgement", estimatedTimeMinutes: 5, description: "On-call engineer acknowledges and starts investigating" },
      { phase: "Investigation", estimatedTimeMinutes: 15, description: "Root cause identified" },
      { phase: "Mitigation", estimatedTimeMinutes: 15, description: "Mitigation applied (rollback, fix, or degradation)" },
      { phase: "Resolution", estimatedTimeMinutes: 10, description: "Service restored to normal" },
      { phase: "Postmortem", estimatedTimeMinutes: 60, description: "Postmortem document written and reviewed" },
    ];
  }
  if (severity === "sev2") {
    return [
      { phase: "Detection", estimatedTimeMinutes: 10, description: "Monitoring detects degradation" },
      { phase: "Investigation", estimatedTimeMinutes: 30, description: "Root cause identified" },
      { phase: "Mitigation", estimatedTimeMinutes: 20, description: "Mitigation applied" },
      { phase: "Resolution", estimatedTimeMinutes: 15, description: "Service restored" },
    ];
  }
  return [
    { phase: "Detection", estimatedTimeMinutes: 30, description: "Issue noticed during routine monitoring" },
    { phase: "Investigation", estimatedTimeMinutes: 30, description: "Root cause identified" },
    { phase: "Resolution", estimatedTimeMinutes: 15, description: "Fix deployed" },
  ];
}

export async function listRecentIncidents(): Promise<IncidentReport[]> {
  // We don't persist incidents in this module — they're generated on demand.
  // In a production system, incidents would be stored in an Incidents table.
  return [];
}
