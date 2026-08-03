/**
 * EduBek — Universal Reasoning Pipeline.
 *
 * Phase 5D.4: Every AI response automatically includes reasoning
 * metadata — confidence, reasoning chain, evidence, sources, affected
 * modules, cost, latency, provider, memory used, recommendations, and
 * follow-up actions.
 *
 * This module is responsible for:
 *   1. Wrapping every AI invocation with reasoning metadata extraction.
 *   2. Persisting the invocation + reasoning for audit.
 *   3. Computing confidence from provider responses when available.
 *   4. Surfacing affected modules by inspecting the AIContext.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { startSpan, finishSpan } from "./observability";
import type { AIContext, AIInvocationDto, ReasoningMetadata } from "./types";

const log = getLogger("reasoning");

// ===========================================================================
// Types
// ===========================================================================

export interface AIInvocationInput {
  ctx?: { userId?: string | null; orgId?: string | null };
  traceId?: string;
  promptId?: string;
  promptVersion?: number;
  provider: string;
  model: string;
  prompt: string;
  context: AIContext;
  /** Raw provider response (string or structured). */
  response: string;
  /** Tokens consumed. */
  tokens: { input: number; output: number };
  /** Estimated cost in USD. */
  costUsd: number;
  /** Latency in ms. */
  latencyMs: number;
  /** Whether the call succeeded. */
  status: "succeeded" | "failed" | "partial";
  /** Optional reasoning hints surfaced by the provider. */
  providerHints?: {
    confidence?: number;
    reasoning?: string;
    evidence?: Array<{ source: string; snippet: string; relevance: number }>;
    sources?: Array<{ type: string; id: string; title: string; url?: string }>;
    memoryUsed?: Array<{ kind: string; id: string; relevance: number }>;
    followUpActions?: Array<{ action: string; rationale: string; priority: number }>;
  };
}

// ===========================================================================
// Public API
// ===========================================================================

export async function recordAIInvocation(input: AIInvocationInput): Promise<AIInvocationDto> {
  const traceId = input.traceId ?? input.context.traceId ?? randomUUID();
  const spanId = startSpan({
    traceId, module: "platform-orchestrator", operation: "ai_invocation",
    attributes: { provider: input.provider, model: input.model, promptId: input.promptId ?? null },
  });
  const startedAt = Date.now();
  try {
    const reasoning = buildReasoning(input, traceId);
    const invocationId = randomUUID();
    await repo.createAIInvocation({
      traceId, promptId: input.promptId ?? null, promptVersion: input.promptVersion ?? null,
      provider: input.provider, model: input.model,
      input: { prompt: input.prompt, contextSnapshot: input.context },
      output: { response: input.response, reasoning },
      status: input.status,
      userId: input.ctx?.userId ?? null,
      organizationId: input.ctx?.orgId ?? null,
      tokensIn: input.tokens.input, tokensOut: input.tokens.output,
      costUsd: input.costUsd, latencyMs: input.latencyMs,
    });
    finishSpan(spanId, traceId, { status: "ok", durationMs: Date.now() - startedAt });
    return {
      id: invocationId,
      traceId,
      promptId: input.promptId ?? null,
      promptVersion: input.promptVersion ?? null,
      provider: input.provider,
      model: input.model,
      input: { prompt: input.prompt, contextSnapshot: input.context },
      output: { response: input.response, reasoning },
      status: input.status,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    finishSpan(spanId, traceId, {
      status: "error", durationMs: Date.now() - startedAt,
      logs: [{ ts: new Date().toISOString(), level: "error", message: (err as Error).message }],
    });
    throw err;
  }
}

// ===========================================================================
// Reasoning metadata builder
// ===========================================================================

function buildReasoning(input: AIInvocationInput, traceId: string): ReasoningMetadata {
  // Confidence — prefer provider hint, otherwise estimate from tokens/output length
  let confidence = input.providerHints?.confidence ?? 0;
  if (confidence === 0) {
    // Heuristic: longer responses with more tokens tend to be more confident
    const outLen = input.response.length;
    if (outLen > 1000) confidence = 0.85;
    else if (outLen > 300) confidence = 0.7;
    else if (outLen > 100) confidence = 0.55;
    else confidence = 0.4;
    // Penalize failed calls
    if (input.status === "failed") confidence *= 0.3;
    // Penalize very fast calls (likely cached or trivial)
    if (input.latencyMs < 50 && input.tokens.input < 10) confidence *= 0.7;
  }
  confidence = Math.max(0, Math.min(1, confidence));

  // Affected modules — derive from context snapshots present
  const affectedModules: string[] = [];
  if (input.context.curriculum) affectedModules.push("knowledge-intelligence");
  if (input.context.knowledgeGraph) affectedModules.push("knowledge-graph");
  if (input.context.learningHistory) affectedModules.push("analytics");
  if (input.context.digitalTwin) affectedModules.push("digital-twins");
  if (input.context.interestProfile) affectedModules.push("discovery");
  if (input.context.mastery) affectedModules.push("knowledge-intelligence");
  if (input.context.recommendations) affectedModules.push("discovery");
  if (input.context.planner) affectedModules.push("learning-planner");
  if (input.context.marketplace) affectedModules.push("marketplace");
  if (input.context.civilizationMemory) affectedModules.push("civilization-engine");
  if (input.context.platformIntelligence) affectedModules.push("platform-intelligence");
  if (input.context.research) affectedModules.push("research-platform");
  if (input.context.globalIntelligence) affectedModules.push("global-intelligence");

  // Recommendations — surface from context if present
  const recommendations = (input.context.recommendations?.personalized ?? [])
    .slice(0, 3)
    .map(r => ({ id: r.id, reason: r.reason, score: r.score }));

  // Follow-up actions — use provider hints or derive from affected modules
  const followUpActions = input.providerHints?.followUpActions ?? deriveFollowUpActions(input.context, affectedModules);

  // Memory used — surface from context snapshots
  const memoryUsed: ReasoningMetadata["memoryUsed"] = [];
  if (input.context.civilizationMemory) {
    memoryUsed.push({
      kind: "civilization_memory",
      id: `org:${input.context.organizationId ?? "unknown"}`,
      relevance: 0.8,
    });
  }
  if (input.context.learningHistory) {
    memoryUsed.push({
      kind: "learning_history",
      id: `user:${input.context.user?.id ?? "anonymous"}`,
      relevance: 0.9,
    });
  }
  if (input.context.platformIntelligence) {
    memoryUsed.push({
      kind: "platform_intelligence",
      id: "global",
      relevance: 0.6,
    });
  }

  return {
    confidence: Math.round(confidence * 100) / 100,
    reasoning: input.providerHints?.reasoning ?? deriveReasoningText(input, affectedModules),
    evidence: input.providerHints?.evidence ?? [],
    sources: input.providerHints?.sources ?? [],
    affectedModules: Array.from(new Set(affectedModules)),
    cost: Math.round(input.costUsd * 10000) / 10000,
    latencyMs: input.latencyMs,
    provider: input.provider,
    model: input.model,
    tokens: input.tokens,
    memoryUsed,
    recommendations,
    followUpActions,
    traceId,
  };
}

function deriveReasoningText(input: AIInvocationInput, affectedModules: string[]): string {
  const parts: string[] = [];
  parts.push(`AI call to ${input.provider}/${input.model} returned ${input.response.length} chars.`);
  parts.push(`Tokens used: ${input.tokens.input} input, ${input.tokens.output} output.`);
  parts.push(`Latency: ${input.latencyMs}ms; estimated cost: $${input.costUsd.toFixed(6)}.`);
  if (affectedModules.length > 0) {
    parts.push(`Context aggregated from: ${affectedModules.join(", ")}.`);
  }
  if (input.context.user) {
    parts.push(`User context: id=${input.context.user.id}, locale=${input.context.user.locale ?? "en"}.`);
  }
  if (input.context.scope.classroomId) {
    parts.push(`Classroom scope: ${input.context.scope.classroomId}.`);
  }
  if (input.context.scope.studentId) {
    parts.push(`Student scope: ${input.context.scope.studentId}.`);
  }
  return parts.join(" ");
}

function deriveFollowUpActions(context: AIContext, affectedModules: string[]): ReasoningMetadata["followUpActions"] {
  const actions: ReasoningMetadata["followUpActions"] = [];
  if (context.planner && context.planner.overdueTasks > 0) {
    actions.push({
      action: "review_overdue_tasks",
      rationale: `User has ${context.planner.overdueTasks} overdue planner tasks.`,
      priority: 3,
    });
  }
  if (context.mastery && context.mastery.strugglingTopics.length > 0) {
    actions.push({
      action: "schedule_remedial_session",
      rationale: `User is struggling with: ${context.mastery.strugglingTopics.slice(0, 3).join(", ")}.`,
      priority: 4,
    });
  }
  if (context.platformIntelligence && context.platformIntelligence.healthStatus !== "healthy") {
    actions.push({
      action: "review_platform_alerts",
      rationale: `Platform health is ${context.platformIntelligence.healthStatus}.`,
      priority: 5,
    });
  }
  if (context.civilizationMemory && context.civilizationMemory.recentDecisions > 0) {
    actions.push({
      action: "review_recent_decisions",
      rationale: `${context.civilizationMemory.recentDecisions} recent institutional decisions recorded.`,
      priority: 2,
    });
  }
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ===========================================================================
// Query helpers
// ===========================================================================

export async function listAIInvocations(limit = 50): Promise<AIInvocationDto[]> {
  const rows = await repo.listAIInvocations(limit);
  return rows.map(r => ({
    id: r.id,
    traceId: r.traceId,
    promptId: r.promptId,
    promptVersion: r.promptVersion,
    provider: r.provider,
    model: r.model,
    input: safeParse(r.input, { prompt: "", contextSnapshot: {} as AIContext }),
    output: safeParse(r.output, { response: "", reasoning: {} as ReasoningMetadata }),
    status: r.status as AIInvocationDto["status"],
    createdAt: r.createdAt.toISOString(),
  }));
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
