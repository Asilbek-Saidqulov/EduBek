/**
 * EduBek — AI Anomaly Detection (System 8).
 * Detects 9 anomaly types: latency spikes, cost spikes, token spikes,
 * provider instability, quality degradation, cache failures, retrieval
 * failures, tool failures, reasoning failures. Produces severity,
 * confidence, root cause hypothesis, affected systems, recommended actions.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AnomalyReport, AnomalyDetection, AnomalyKind } from "./types";

const log = getLogger("anomaly-detector");

export async function generateAnomalyReport(): Promise<AnomalyReport> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [invocations, evaluations, spans] = await Promise.all([
    repo.fetchAIInvocations({ since, limit: 500 }),
    repo.fetchQualityEvaluations({ since, limit: 100 }),
    repo.fetchTraceSpans({ since, limit: 500 }),
  ]);
  const anomalies: AnomalyDetection[] = [];
  // Latency spike — check for invocations with latency > 3x average
  if (invocations.length > 10) {
    const avgLatency = invocations.reduce((s, i) => s + i.latencyMs, 0) / invocations.length;
    const spikes = invocations.filter(i => i.latencyMs > avgLatency * 3);
    if (spikes.length > 0) {
      anomalies.push(makeAnomaly("latency_spike", "high", 0.8,
        `${spikes.length} invocation(s) have latency > 3x average (${Math.round(avgLatency)}ms)`,
        "Likely caused by provider congestion or complex prompts",
        ["ai-workspace", "cloud-infra"],
        ["Check provider status", "Review prompt complexity", "Enable caching"]
      ));
    }
  }
  // Cost spike — check for invocations with cost > 5x average
  if (invocations.length > 10) {
    const avgCost = invocations.reduce((s, i) => s + i.costUsd, 0) / invocations.length;
    const spikes = invocations.filter(i => i.costUsd > avgCost * 5 && i.costUsd > 0.01);
    if (spikes.length > 0) {
      anomalies.push(makeAnomaly("cost_spike", "medium", 0.7,
        `${spikes.length} invocation(s) have cost > 5x average ($${avgCost.toFixed(4)})`,
        "Likely caused by long prompts or expensive models",
        ["ai-workspace", "cost-tracking"],
        ["Switch to cheaper model for non-critical calls", "Reduce prompt length"]
      ));
    }
  }
  // Token spike — check for invocations with tokens > 3x average
  if (invocations.length > 10) {
    const avgTokens = invocations.reduce((s, i) => s + i.tokensIn + i.tokensOut, 0) / invocations.length;
    const spikes = invocations.filter(i => (i.tokensIn + i.tokensOut) > avgTokens * 3);
    if (spikes.length > 0) {
      anomalies.push(makeAnomaly("token_spike", "medium", 0.7,
        `${spikes.length} invocation(s) have token usage > 3x average (${Math.round(avgTokens)})`,
        "Likely caused by long context or verbose outputs",
        ["ai-workspace"],
        ["Reduce context size", "Simplify prompts"]
      ));
    }
  }
  // Provider instability — check for high failure rate
  const failureRate = invocations.length > 0 ? invocations.filter(i => i.status !== "succeeded").length / invocations.length : 0;
  if (failureRate > 0.1) {
    anomalies.push(makeAnomaly("provider_instability", "critical", 0.9,
      `AI provider failure rate is ${(failureRate * 100).toFixed(1)}% (> 10%)`,
      "Provider may be experiencing an outage or rate limiting",
      ["ai-workspace", "cloud-infra"],
      ["Check provider status", "Enable circuit breaker", "Switch to fallback provider"]
    ));
  }
  // Quality degradation — check for low evaluation scores
  if (evaluations.length > 5) {
    const lowQuality = evaluations.filter(e => e.overallScore < 0.4);
    if (lowQuality.length > evaluations.length * 0.2) {
      anomalies.push(makeAnomaly("quality_degradation", "high", 0.8,
        `${lowQuality.length} evaluation(s) have quality score < 0.4`,
        "Prompts may need revision or model may be degrading",
        ["ai-quality", "ai-workspace"],
        ["Review prompt versions", "Run prompt regression tests", "Consider model switch"]
      ));
    }
  }
  // Tool/reasoning/retrieval failures — check error spans
  const errorSpans = spans.filter(s => s.status === "error");
  if (errorSpans.length > 10) {
    const toolErrors = errorSpans.filter(s => s.operation.includes("tool"));
    const reasoningErrors = errorSpans.filter(s => s.operation.includes("reasoning"));
    const retrievalErrors = errorSpans.filter(s => s.operation.includes("retrieval"));
    if (toolErrors.length > 3) anomalies.push(makeAnomaly("tool_failure", "medium", 0.7, `${toolErrors.length} tool call failures`, "Tool integration may be broken", ["cognitive-ai"], ["Check tool configurations"]));
    if (reasoningErrors.length > 3) anomalies.push(makeAnomaly("reasoning_failure", "high", 0.8, `${reasoningErrors.length} reasoning failures`, "Reasoning engine may be overloaded", ["cognitive-ai"], ["Check reasoning engine status"]));
    if (retrievalErrors.length > 3) anomalies.push(makeAnomaly("retrieval_failure", "high", 0.8, `${retrievalErrors.length} retrieval failures`, "Knowledge retrieval may be failing", ["cognitive-ai", "knowledge-intelligence"], ["Check search index health", "Verify embedding service"]));
  }
  // Cache failure — check for low cache hit rate (approximate)
  if (invocations.length > 20) {
    // We can't directly check cache hits from invocations — approximate from trace spans
    const cacheSpans = spans.filter(s => repo.safeParse<Record<string, unknown>>(s.attributes, {}).cacheHit !== undefined);
    if (cacheSpans.length > 0) {
      const cacheHits = cacheSpans.filter(s => repo.safeParse<Record<string, unknown>>(s.attributes, {}).cacheHit === true).length;
      const hitRate = cacheHits / cacheSpans.length;
      if (hitRate < 0.1) {
        anomalies.push(makeAnomaly("cache_failure", "low", 0.6, `Cache hit rate is ${(hitRate * 100).toFixed(1)}% (< 10%)`, "Cache may be misconfigured or evicting too aggressively", ["cloud-infra"], ["Review cache TTL", "Check cache capacity"]));
      }
    }
  }
  // Persist anomalies
  for (const a of anomalies) {
    await repo.createAnomaly({
      kind: a.kind, severity: a.severity, confidence: a.confidence,
      description: a.description, rootCauseHypothesis: a.rootCauseHypothesis,
      affectedSystems: a.affectedSystems, recommendedActions: a.recommendedActions,
    }).catch(() => { /* best-effort */ });
  }
  const criticalCount = anomalies.filter(a => a.severity === "critical").length;
  log.info("anomaly.report_complete", { anomalies: anomalies.length, critical: criticalCount });
  return {
    generatedAt: new Date().toISOString(),
    anomalies, totalCount: anomalies.length, criticalCount,
  };
}

function makeAnomaly(kind: AnomalyKind, severity: AnomalyDetection["severity"], confidence: number, description: string, rootCause: string, affected: string[], actions: string[]): AnomalyDetection {
  return {
    id: randomUUID(), kind, severity, confidence, description,
    rootCauseHypothesis: rootCause, affectedSystems: affected,
    recommendedActions: actions, detectedAt: new Date().toISOString(),
  };
}
