/**
 * EduBek — Universal AI Workspace Orchestrator.
 *
 * Phase 5D.4: ONE orchestration layer for every AI request. Every
 * subsystem that needs AI calls goes through this pipeline:
 *
 *   AI Workspace
 *     ↓ Provider Router
 *     ↓ Prompt Library (registry)
 *     ↓ Memory
 *     ↓ Context Builder
 *     ↓ Knowledge Graph
 *     ↓ Curriculum / Discovery / Planner / Twins / Research / Education OS
 *     ↓ Inference Gateway
 *     ↓ Audit
 *     ↓ Feedback Engine
 *     ↓ Optimization Engine
 *     ↓ Response (with reasoning metadata)
 *
 * This module is intentionally provider-agnostic — it delegates the
 * actual inference call to the existing `@/infra/ai-providers`
 * infrastructure and focuses on orchestration, context aggregation,
 * and reasoning-metadata extraction.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { generate as aiGenerate } from "@/infra/ai-providers";
import { buildAIContext } from "./context-builder";
import { resolvePrompt, recordPromptEvaluation } from "./prompt-registry";
import { recordAIInvocation } from "./reasoning";
import { startSpan, finishSpan } from "./observability";
import { withCircuitBreaker } from "./production";
import type { AuthContext } from "@/features/rbac";
import type { AIContext, AIInvocationDto, ReasoningMetadata } from "./types";

const log = getLogger("ai-workspace-orchestrator");

// ===========================================================================
// Types
// ===========================================================================

export interface InvokeAIInput {
  ctx: AuthContext;
  /** Organization ID (passed separately because AuthContext is org-agnostic). */
  organizationId?: string | null;
  promptId?: string;
  promptVars?: Record<string, string | number | undefined>;
  /** Override the resolved prompt with a raw string. */
  rawPrompt?: string;
  /** Override the provider (defaults to the prompt's providerOverride or 'hash'). */
  provider?: string;
  /** Override the model. */
  model?: string;
  /** Scope hints for context building. */
  scope?: AIContext["scope"];
  /** Skip context-building (perf optimization for trivial calls). */
  skipContext?: boolean;
  /** Trace ID for distributed tracing. */
  traceId?: string;
}

export interface InvokeAIResult {
  invocation: AIInvocationDto;
  response: string;
  reasoning: ReasoningMetadata;
  context: AIContext;
}

// ===========================================================================
// Public API
// ===========================================================================

export async function invokeAI(input: InvokeAIInput): Promise<InvokeAIResult> {
  const traceId = input.traceId ?? randomUUID();
  const rootSpanId = startSpan({
    traceId, parentSpanId: null,
    module: "platform-orchestrator",
    operation: "ai_workspace.invoke",
    attributes: { promptId: input.promptId, provider: input.provider, hasRawPrompt: !!input.rawPrompt },
  });
  const startedAt = Date.now();

  try {
    // 1. Build context (parallel with prompt resolution)
    const [context, promptResult] = await Promise.all([
      input.skipContext
        ? Promise.resolve<AIContext>({
            traceId, user: input.ctx.userId ? {
              id: input.ctx.userId, email: input.ctx.email, locale: input.ctx.locale,
              roles: input.ctx.platformRoles,
              permissions: input.ctx.personalPermissionOverrides.map(p => p.permission),
            } : null,
            organizationId: input.organizationId ?? null,
            scope: input.scope ?? {},
            hints: {},
            assembledAt: new Date().toISOString(),
          })
        : buildAIContext({
            ctx: input.ctx, organizationId: input.organizationId, scope: input.scope,
            hints: { traceId },
          }),
      input.rawPrompt
        ? Promise.resolve({ prompt: input.rawPrompt, definition: null })
        : input.promptId
          ? resolvePrompt(input.promptId, input.promptVars ?? {})
          : Promise.resolve({ prompt: input.rawPrompt ?? "", definition: null }),
    ]);

    if (!promptResult.prompt) {
      throw new Error("No prompt provided — pass either promptId or rawPrompt");
    }

    // 2. Determine provider + model
    const provider = input.provider ?? promptResult.definition?.providerOverride ?? "hash";
    const model = input.model ?? promptResult.definition?.modelOverride ?? "default";

    // 3. Call inference gateway via circuit breaker
    const inferenceSpanId = startSpan({
      traceId, parentSpanId: rootSpanId,
      module: "ai-workspace", operation: "inference_gateway.call",
      attributes: { provider, model, promptLength: promptResult.prompt.length },
    });
    const inferenceStart = Date.now();
    let response: string;
    let actualProvider = provider;
    let actualModel = model;
    let actualTokensIn = 0;
    let actualTokensOut = 0;
    let actualCostUsd = 0;
    let status: "succeeded" | "failed" | "partial" = "succeeded";
    try {
      const fallbackResult = {
        content: "[AI call skipped — circuit breaker open]",
        model, provider,
        tokensIn: 0, tokensOut: 0, costUsd: 0,
        latencyMs: 0, finishReason: null as string | null,
        complexity: "fallback",
      };
      const result = await withCircuitBreaker(
        `ai:${provider}`,
        "ai-workspace",
        async () => aiGenerate(
          {
            systemPrompt: "You are EduBek, an AI assistant for an education platform. Help the user with their request using the provided context.",
            userPrompt: promptResult.prompt,
            model: model === "default" ? undefined : model,
          },
          "orchestrator",
        ),
        fallbackResult,
      );
      response = result.content ?? "";
      actualProvider = result.provider;
      actualModel = result.model;
      actualTokensIn = result.tokensIn;
      actualTokensOut = result.tokensOut;
      actualCostUsd = result.costUsd;
      finishSpan(inferenceSpanId, traceId, {
        status: "ok", durationMs: Date.now() - inferenceStart,
      });
    } catch (err) {
      finishSpan(inferenceSpanId, traceId, {
        status: "error", durationMs: Date.now() - inferenceStart,
        logs: [{ ts: new Date().toISOString(), level: "error", message: (err as Error).message }],
      });
      status = "failed";
      response = `[AI call failed: ${(err as Error).message}]`;
    }

    const latencyMs = Date.now() - inferenceStart;
    // 4. Use actual values when available, otherwise estimate
    const tokensIn = actualTokensIn > 0 ? actualTokensIn : Math.ceil(promptResult.prompt.length / 4);
    const tokensOut = actualTokensOut > 0 ? actualTokensOut : Math.ceil(response.length / 4);
    const costUsd = actualCostUsd > 0 ? actualCostUsd : estimateCost(provider, model, tokensIn, tokensOut);

    // 5. Record the invocation with reasoning metadata
    const invocation = await recordAIInvocation({
      ctx: { userId: input.ctx.userId, orgId: input.organizationId ?? null },
      traceId,
      promptId: promptResult.definition?.id,
      promptVersion: promptResult.definition?.version,
      provider: actualProvider, model: actualModel,
      prompt: promptResult.prompt,
      context,
      response,
      tokens: { input: tokensIn, output: tokensOut },
      costUsd,
      latencyMs,
      status,
    });

    // 6. Feed prompt evaluation back into the registry (only for successful calls)
    if (promptResult.definition && status === "succeeded") {
      // Simple evaluation: longer responses get higher scores (very rough heuristic)
      const score = Math.min(1, response.length / 1000);
      void recordPromptEvaluation(promptResult.definition.id, score).catch(() => null);
    }

    finishSpan(rootSpanId, traceId, {
      status: status === "succeeded" ? "ok" : "error",
      durationMs: Date.now() - startedAt,
    });

    log.info("ai_workspace.invoked", {
      traceId, promptId: promptResult.definition?.id ?? null,
      provider, model, latencyMs, tokensIn, tokensOut, costUsd, status,
    });

    return {
      invocation,
      response,
      reasoning: invocation.output.reasoning,
      context,
    };
  } catch (err) {
    finishSpan(rootSpanId, traceId, {
      status: "error", durationMs: Date.now() - startedAt,
      logs: [{ ts: new Date().toISOString(), level: "error", message: (err as Error).message }],
    });
    throw err;
  }
}

// ===========================================================================
// Cost estimation
// ===========================================================================

const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  hash: { input: 0, output: 0 },
  gemini: { input: 0.000125, output: 0.000375 },
  openai: { input: 0.0005, output: 0.0015 },
  voyage: { input: 0.0001, output: 0.0001 },
  cohere: { input: 0.00015, output: 0.00025 },
  jina: { input: 0.0001, output: 0.0001 },
  nomic: { input: 0.0001, output: 0.0001 },
  local: { input: 0, output: 0 },
  edubek: { input: 0.0001, output: 0.0002 },
};

export function estimateCost(provider: string, model: string, tokensIn: number, tokensOut: number): number {
  const rates = COST_PER_1K_TOKENS[provider] ?? { input: 0.0001, output: 0.0002 };
  const cost = (tokensIn / 1000) * rates.input + (tokensOut / 1000) * rates.output;
  return Math.round(cost * 10000) / 10000;
}

// ===========================================================================
// Stats
// ===========================================================================

export async function aiWorkspaceStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [invocationsToday, latencyInfo] = await Promise.all([
    import("./repository").then(r => r.countAIInvocationsSince(since)),
    import("./repository").then(r => r.averageAILatencySince(since)),
  ]);
  return {
    invocationsToday,
    averageLatencyMs: latencyInfo.avg,
    successRate: latencyInfo.successRate,
  };
}
