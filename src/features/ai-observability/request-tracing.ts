/**
 * EduBek — AI Request Tracing (System 1).
 *
 * Traces every AI invocation — request id, user, organization, feature,
 * prompt id/version, model, provider, tokens, latency, cost, retries,
 * cache hit, tool calls, reasoning duration, retrieval duration, total
 * execution timeline.
 *
 * REUSES OrchestratorAIInvocation + OrchestratorTraceSpan — never
 * duplicates tracing.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AIRequestTrace, RequestTracingReport } from "./types";

const log = getLogger("request-tracing");

export async function generateTracingReport(opts: {
  since?: Date; limit?: number;
} = {}): Promise<RequestTracingReport> {
  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [invocations, spans] = await Promise.all([
    repo.fetchAIInvocations({ since, limit: opts.limit ?? 500 }),
    repo.fetchTraceSpans({ since, limit: 1000 }),
  ]);
  // Build trace timeline by joining invocations with their spans
  const spansByTrace = new Map<string, typeof spans>();
  for (const s of spans) {
    if (!spansByTrace.has(s.traceId)) spansByTrace.set(s.traceId, []);
    spansByTrace.get(s.traceId)!.push(s);
  }
  const traces: AIRequestTrace[] = invocations.map(inv => {
    const traceSpans = spansByTrace.get(inv.traceId) ?? [];
    const reasoningSpan = traceSpans.find(s => s.operation.includes("reasoning") || s.operation.includes("inference"));
    const retrievalSpan = traceSpans.find(s => s.operation.includes("retrieval") || s.operation.includes("knowledge"));
    const toolSpans = traceSpans.filter(s => s.operation.includes("tool") || s.operation.includes("step"));
    const reasoningMs = reasoningSpan?.durationMs ?? 0;
    const retrievalMs = retrievalSpan?.durationMs ?? 0;
    return {
      traceId: inv.traceId,
      requestId: inv.id,
      userId: inv.userId,
      organizationId: inv.organizationId,
      feature: inv.promptId ?? null,
      promptId: inv.promptId,
      promptVersion: inv.promptVersion,
      model: inv.model,
      provider: inv.provider,
      tokensIn: inv.tokensIn,
      tokensOut: inv.tokensOut,
      costUsd: inv.costUsd,
      latencyMs: inv.latencyMs,
      retries: traceSpans.filter(s => s.status === "error").length,
      cacheHit: traceSpans.some(s => repo.safeParse<Record<string, unknown>>(s.attributes, {}).cacheHit === true),
      toolCalls: toolSpans.length,
      reasoningDurationMs: reasoningMs,
      retrievalDurationMs: retrievalMs,
      totalExecutionMs: inv.latencyMs,
      status: inv.status,
      startedAt: inv.createdAt.toISOString(),
      completedAt: new Date(inv.createdAt.getTime() + inv.latencyMs).toISOString(),
    };
  });
  const successCount = traces.filter(t => t.status === "succeeded").length;
  const summary = {
    successRate: traces.length > 0 ? Math.round((successCount / traces.length) * 100) / 100 : 0,
    avgLatencyMs: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.latencyMs, 0) / traces.length) : 0,
    avgCostUsd: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.costUsd, 0) / traces.length * 10000) / 10000 : 0,
    avgTokensIn: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.tokensIn, 0) / traces.length) : 0,
    avgTokensOut: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.tokensOut, 0) / traces.length) : 0,
    cacheHitRate: traces.length > 0 ? Math.round(traces.filter(t => t.cacheHit).length / traces.length * 100) / 100 : 0,
    avgRetries: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.retries, 0) / traces.length * 100) / 100 : 0,
    avgToolCalls: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.toolCalls, 0) / traces.length * 100) / 100 : 0,
    avgReasoningMs: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.reasoningDurationMs, 0) / traces.length) : 0,
    avgRetrievalMs: traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.retrievalDurationMs, 0) / traces.length) : 0,
  };
  log.info("tracing.report_complete", { traces: traces.length, successRate: summary.successRate });
  return {
    generatedAt: new Date().toISOString(),
    totalTraces: traces.length,
    traces: traces.slice(0, opts.limit ?? 100),
    summary,
  };
}
