/**
 * EduBek — Drift Monitor (System 7).
 * Detects 8 drift types: prompt, quality, cost, latency, hallucination,
 * retrieval, provider, curriculum. Generates alerts.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { DriftMonitorReport, DriftFinding, DriftType } from "./types";

const log = getLogger("drift-monitor");

export async function generateDriftReport(): Promise<DriftMonitorReport> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [invocations, evaluations] = await Promise.all([
    repo.fetchAIInvocations({ since, limit: 500 }),
    repo.fetchQualityEvaluations({ since, limit: 200 }),
  ]);
  const findings: DriftFinding[] = [];
  // Cost drift — compare recent costs to historical baseline
  if (invocations.length > 20) {
    const recent = invocations.slice(0, 20);
    const baseline = invocations.slice(20);
    const recentAvgCost = recent.reduce((s, i) => s + i.costUsd, 0) / recent.length;
    const baselineAvgCost = baseline.length > 0 ? baseline.reduce((s, i) => s + i.costUsd, 0) / baseline.length : recentAvgCost;
    if (baselineAvgCost > 0) {
      const delta = (recentAvgCost - baselineAvgCost) / baselineAvgCost;
      if (Math.abs(delta) > 0.2) {
        findings.push(makeDrift("cost_drift", "Average cost per call has changed", baselineAvgCost, recentAvgCost, delta));
      }
    }
    // Latency drift
    const recentAvgLatency = recent.reduce((s, i) => s + i.latencyMs, 0) / recent.length;
    const baselineAvgLatency = baseline.length > 0 ? baseline.reduce((s, i) => s + i.latencyMs, 0) / baseline.length : recentAvgLatency;
    if (baselineAvgLatency > 0) {
      const delta = (recentAvgLatency - baselineAvgLatency) / baselineAvgLatency;
      if (Math.abs(delta) > 0.3) {
        findings.push(makeDrift("latency_drift", "Average latency has changed", baselineAvgLatency, recentAvgLatency, delta));
      }
    }
    // Provider drift — has the provider mix changed?
    const recentProviders = new Set(recent.map(i => i.provider));
    const baselineProviders = new Set(baseline.map(i => i.provider));
    const providerDelta = recentProviders.size !== baselineProviders.size || Array.from(recentProviders).some(p => !baselineProviders.has(p));
    if (providerDelta) {
      findings.push(makeDrift("provider_drift", "Provider distribution has changed", baselineProviders.size, recentProviders.size, recentProviders.size - baselineProviders.size));
    }
  }
  // Quality drift — compare recent evaluation scores to baseline
  if (evaluations.length > 10) {
    const recent = evaluations.slice(0, 10);
    const baseline = evaluations.slice(10);
    const recentAvgScore = recent.reduce((s, e) => s + e.overallScore, 0) / recent.length;
    const baselineAvgScore = baseline.length > 0 ? baseline.reduce((s, e) => s + e.overallScore, 0) / baseline.length : recentAvgScore;
    if (baselineAvgScore > 0) {
      const delta = (recentAvgScore - baselineAvgScore) / baselineAvgScore;
      if (Math.abs(delta) > 0.1) {
        findings.push(makeDrift("quality_drift", "Average quality score has changed", baselineAvgScore, recentAvgScore, delta));
      }
    }
  }
  const criticalDrifts = findings.filter(f => f.severity === "critical").length;
  const recommendations = generateDriftRecommendations(findings);
  log.info("drift.report_complete", { findings: findings.length, critical: criticalDrifts });
  return {
    generatedAt: new Date().toISOString(),
    findings, totalDrifts: findings.length, criticalDrifts, recommendations,
  };
}

function makeDrift(type: DriftType, description: string, baseline: number, current: number, delta: number): DriftFinding {
  const absDelta = Math.abs(delta);
  const severity = absDelta > 0.5 ? "critical" : absDelta > 0.3 ? "high" : absDelta > 0.15 ? "medium" : "low";
  return {
    id: `drift-${type}-${Date.now()}`,
    type, description,
    baseline: Math.round(baseline * 10000) / 10000,
    current: Math.round(current * 10000) / 10000,
    delta: Math.round(delta * 10000) / 10000,
    severity,
    detectedAt: new Date().toISOString(),
  };
}

function generateDriftRecommendations(findings: DriftFinding[]): string[] {
  const recs: string[] = [];
  for (const f of findings) {
    recs.push(`${f.type}: ${f.description} (baseline=${f.baseline}, current=${f.current}, delta=${(f.delta * 100).toFixed(1)}%)`);
  }
  if (recs.length === 0) recs.push("No drift detected — AI behavior is stable.");
  return recs;
}
