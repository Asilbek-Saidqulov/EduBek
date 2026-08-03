/**
 * EduBek — Alert Manager (System 12).
 * Generates alerts for 9 types: provider outage, quality degradation,
 * latency spike, cost anomaly, hallucination increase, routing instability,
 * prompt regression, experiment completion, drift detection.
 * Severities: info, warning, critical, resolved.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { generateAnomalyReport } from "./anomaly-detector";
import { generateDriftReport } from "./drift-monitor";
import { generateExperimentReport } from "./experiment-engine";
import type { AIAlert, AlertManagerReport, AlertKind, AlertSeverity } from "./types";

const log = getLogger("alert-manager");

export async function generateAlerts(): Promise<AlertManagerReport> {
  const [anomalies, drift, experiments, existingAlerts] = await Promise.all([
    generateAnomalyReport().catch(() => null),
    generateDriftReport().catch(() => null),
    generateExperimentReport().catch(() => null),
    repo.listAlerts(50),
  ]);
  const alerts: AIAlert[] = [];
  // Generate alerts from anomalies
  if (anomalies) {
    for (const a of anomalies.anomalies) {
      const kind = anomalyToAlertKind(a.kind);
      const severity = (a.severity === "critical" ? "critical" : a.severity === "high" ? "warning" : a.severity === "medium" ? "warning" : "info") as AlertSeverity;
      alerts.push({
        id: a.id,
        kind, severity,
        title: `${a.kind.replace(/_/g, " ")} — ${a.severity}`,
        description: a.description,
        affectedSystems: a.affectedSystems,
        recommendedActions: a.recommendedActions,
        createdAt: a.detectedAt,
        acknowledgedAt: null,
        resolvedAt: null,
      });
      // Persist the alert
      await repo.createAlert({
        kind, severity, title: `${a.kind.replace(/_/g, " ")} — ${a.severity}`,
        description: a.description,
        affectedSystems: a.affectedSystems,
        recommendedActions: a.recommendedActions,
      }).catch(() => { /* best-effort */ });
    }
  }
  // Generate alerts from drift
  if (drift) {
    for (const f of drift.findings) {
      if (f.severity === "critical" || f.severity === "high") {
        alerts.push({
          id: f.id,
          kind: "drift_detection" as AlertKind,
          severity: (f.severity === "critical" ? "critical" : f.severity === "high" ? "warning" : "info") as AlertSeverity,
          title: `Drift detected: ${f.type.replace(/_/g, " ")}`,
          description: f.description,
          affectedSystems: ["ai-workspace"],
          recommendedActions: [`Investigate ${f.type} — baseline=${f.baseline}, current=${f.current}`],
          createdAt: f.detectedAt,
          acknowledgedAt: null,
          resolvedAt: null,
        });
      }
    }
  }
  // Generate alerts for completed experiments
  if (experiments) {
    for (const e of experiments.experiments) {
      if (e.status === "completed" && e.winnerVariant) {
        alerts.push({
          id: `exp-${e.id}`,
          kind: "experiment_completion" as AlertKind,
          severity: "info" as AlertSeverity,
          title: `Experiment completed: ${e.name}`,
          description: `Winner: ${e.winnerVariant} (confidence: ${e.winnerConfidence})`,
          affectedSystems: ["ai-observability"],
          recommendedActions: [`Review and deploy ${e.winnerVariant} manually`],
          createdAt: new Date().toISOString(),
          acknowledgedAt: null,
          resolvedAt: null,
        });
      }
    }
  }
  // Include existing persisted alerts (that aren't duplicated)
  for (const a of existingAlerts) {
    const exists = alerts.some(x => x.kind === a.kind && x.title === a.title);
    if (!exists) {
      alerts.push({
        id: a.id,
        kind: a.kind as AlertKind,
        severity: a.severity as AlertSeverity,
        title: a.title,
        description: a.description,
        affectedSystems: repo.safeParse(a.affectedSystems, []),
        recommendedActions: repo.safeParse(a.recommendedActions, []),
        createdAt: a.createdAt.toISOString(),
        acknowledgedAt: a.acknowledgedAt?.toISOString() ?? null,
        resolvedAt: a.resolvedAt?.toISOString() ?? null,
      });
    }
  }
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;
  const infoCount = alerts.filter(a => a.severity === "info").length;
  const resolvedCount = alerts.filter(a => a.severity === "resolved").length;
  log.info("alert.report_complete", { alerts: alerts.length, critical: criticalCount });
  return {
    generatedAt: new Date().toISOString(),
    alerts: alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, resolved: 3 };
      return order[a.severity] - order[b.severity];
    }),
    criticalCount, warningCount, infoCount, resolvedCount,
  };
}

export async function listAlerts(limit = 50) {
  return repo.listAlerts(limit);
}

export async function acknowledgeAlert(id: string): Promise<void> {
  await repo.acknowledgeAlert(id);
  log.info("alert.acknowledged", { id });
}

export async function resolveAlert(id: string): Promise<void> {
  await repo.resolveAlert(id);
  log.info("alert.resolved", { id });
}

function anomalyToAlertKind(anomalyKind: string): AlertKind {
  const map: Record<string, AlertKind> = {
    latency_spike: "latency_spike",
    cost_spike: "cost_anomaly",
    token_spike: "cost_anomaly",
    provider_instability: "provider_outage",
    quality_degradation: "quality_degradation",
    cache_failure: "routing_instability",
    retrieval_failure: "routing_instability",
    tool_failure: "routing_instability",
    reasoning_failure: "quality_degradation",
  };
  return map[anomalyKind] ?? "quality_degradation";
}
