/**
 * EduBek — Cognitive Reasoning Engine (System 4 + 16 + 18).
 *
 * Layered reasoning pipeline:
 *   Input → Intent → Knowledge Retrieval → Dependency Analysis →
 *   Goal Analysis → Planning → Evidence Collection → Reasoning →
 *   Verification → Confidence → Answer
 *
 * Every stage is reusable. The engine orchestrates existing modules
 * (Platform Orchestrator's invokeAI, Product Intelligence's
 * detectIntent, Discovery's search, etc.) and never duplicates logic.
 *
 * AI Cost Requirements:
 *   • Prefer deterministic algorithms
 *   • Use existing structured data before calling an LLM
 *   • Call the LLM only when natural-language generation is required
 *   • Cache reusable reasoning outputs
 *   • Reuse retrieved evidence across stages
 *   • Never invoke multiple LLM providers for the same task
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type { AuthContext } from "@/features/rbac";
import { detectIntent } from "@/features/product-intelligence";
import { invokeAI } from "@/features/platform-orchestrator/ai-workspace";
import * as repo from "./repository";
import { retrieveEvidence } from "./knowledge-retrieval";
import { selectTools } from "./tool-selection";
import { estimateUncertainty, explainUncertainty } from "./uncertainty-engine";
import { verifyAnswer } from "./verification-engine";
import { buildExplanation } from "./explanation-engine";
import { reflectOnAction } from "./reflection-engine";
import { listGoals, rankGoalsForContext } from "./goal-engine";
import { pickPlanTemplate, generatePlanFromTemplate, getPlan } from "./planning-engine";
import { getCachedReasoning, cacheReasoning, getParameters } from "./learning-loop";
import { recordEpisode } from "./episodic-memory";
import type {
  CognitiveReasoningResult, ReasoningStageResult, EvidenceItem,
  CognitiveGoal, PlanningGraph, DecisionResult, Explanation,
} from "./types";

const log = getLogger("cognitive-reasoning-engine");

// ===========================================================================
// Public API
// ===========================================================================

export interface ReasonInput {
  ctx: AuthContext;
  query: string;
  organizationId?: string | null;
  classroomId?: string | null;
  conversationId?: string | null;
  traceId?: string;
  /** Skip LLM call (deterministic-only mode). */
  deterministicOnly?: boolean;
  /** Whether to generate a plan before answering. */
  shouldPlan?: boolean;
}

export async function reason(input: ReasonInput): Promise<CognitiveReasoningResult & { explanation: Explanation }> {
  const traceId = input.traceId ?? randomUUID();
  const startedAt = Date.now();
  const stages: ReasoningStageResult[] = [];
  let llmInvoked = false;
  let estimatedCost = 0;

  log.info("reasoning.start", { traceId, query: input.query });

  // STAGE 1: Intent
  const intentStage = await runStage("intent", async () => {
    const intent = await detectIntent({ userId: input.ctx.userId!, query: input.query });
    return { intent, usedLLM: false };
  });
  stages.push(intentStage.result);
  const intent = intentStage.output.intent;

  // STAGE 2: Knowledge Retrieval (reuse evidence across all later stages)
  const retrievalStage = await runStage("knowledge_retrieval", async () => {
    const evidenceGraph = await retrieveEvidence(input.query, {
      userId: input.ctx.userId,
      organizationId: input.organizationId ?? undefined,
      classroomId: input.classroomId ?? undefined,
    });
    return { evidenceGraph, usedLLM: false };
  });
  stages.push(retrievalStage.result);
  const evidenceGraph = retrievalStage.output.evidenceGraph;
  let evidence: EvidenceItem[] = evidenceGraph.evidence;

  // STAGE 3: Dependency Analysis (deterministic — based on intent's required systems)
  const dependencyStage = await runStage("dependency_analysis", async () => {
    const requiredSystems = intent.requiredSystems;
    const availableSystems = evidenceGraph.sourcesWithResults;
    const missing = requiredSystems.filter(s => !availableSystems.includes(s));
    return { requiredSystems, availableSystems, missing, usedLLM: false };
  });
  stages.push(dependencyStage.result);

  // STAGE 4: Goal Analysis
  const goalStage = await runStage("goal_analysis", async () => {
    const allGoals = await listGoals("active").catch(() => [] as CognitiveGoal[]);
    const ranked = await rankGoalsForContext({
      roles: input.ctx.platformRoles,
      activeGoals: allGoals,
      intent: intent.intent,
    });
    const relevantGoals = ranked.slice(0, 5);
    return { goals: relevantGoals, usedLLM: false };
  });
  stages.push(goalStage.result);
  const goals: CognitiveGoal[] = goalStage.output.goals;

  // STAGE 5: Planning (optional)
  let plan: PlanningGraph | null = null;
  if (input.shouldPlan ?? intent.intent !== "ask_ai") {
    const planStage = await runStage("planning", async () => {
      const templateId = pickPlanTemplate(input.query);
      if (templateId) {
        const generatedPlan = await generatePlanFromTemplate(templateId, input.ctx.userId).catch(() => null);
        return { plan: generatedPlan, templateId, usedLLM: false };
      }
      return { plan: null, templateId: null, usedLLM: false };
    });
    stages.push(planStage.result);
    plan = planStage.output.plan;
  }

  // STAGE 6: Evidence Collection (already done in stage 2 — reuse)
  const evidenceStage = await runStage("evidence_collection", async () => {
    return {
      evidenceCount: evidence.length,
      sourcesCount: evidenceGraph.sourcesWithResults.length,
      usedLLM: false,
    };
  });
  stages.push(evidenceStage.result);

  // STAGE 7: Reasoning — decide whether an LLM call is necessary
  let answer: string;
  let decision: DecisionResult | null = null;
  const reasoningStage = await runStage("reasoning", async () => {
    // Check cache first
    const cacheKey = `reason:${intent.intent}:${input.query.slice(0, 100)}`;
    const cached = getCachedReasoning<{ answer: string; decision: DecisionResult | null }>(cacheKey);
    if (cached) {
      return { answer: cached.answer, decision: cached.decision, usedLLM: false, fromCache: true };
    }
    // Decide whether to use LLM
    const params = getParameters();
    const shouldUseLLM = !input.deterministicOnly
      && evidence.length >= 1 // need some evidence to ground the answer
      && intent.intent !== "ask_ai" || (intent.intent === "ask_ai" && evidence.length === 0);
    if (shouldUseLLM && input.ctx.userId) {
      try {
        const toolSelection = selectTools({
          intent: intent.intent,
          query: input.query,
          availablePermissions: input.ctx.personalPermissionOverrides
            .filter(p => p.granted).map(p => p.permission),
          goals: goals.map(g => g.kind),
        });
        const llmResult = await invokeAI({
          ctx: input.ctx,
          organizationId: input.organizationId,
          rawPrompt: buildReasoningPrompt(input.query, intent.intent, evidence, goals),
          scope: input.classroomId ? { classroomId: input.classroomId } : {},
          traceId,
          skipContext: true, // we already have evidence
        });
        answer = llmResult.response;
        llmInvoked = true;
        estimatedCost += llmResult.reasoning.cost;
        cacheReasoning(cacheKey, { answer, decision }, 60 * 60 * 1000);
        return { answer, decision, usedLLM: true, fromCache: false, toolSelection };
      } catch (err) {
        log.warn("reasoning.llm_failed", { error: (err as Error).message });
        answer = buildDeterministicAnswer(input.query, intent, evidence, goals);
        return { answer, decision: null, usedLLM: false, fromCache: false, error: (err as Error).message };
      }
    } else {
      // Deterministic answer from evidence
      answer = buildDeterministicAnswer(input.query, intent, evidence, goals);
      return { answer, decision: null, usedLLM: false, fromCache: false };
    }
  });
  stages.push(reasoningStage.result);
  answer = reasoningStage.output.answer ?? "";
  decision = reasoningStage.output.decision ?? null;

  // STAGE 8: Verification
  const verificationStage = await runStage("verification", async () => {
    const result = await verifyAnswer({
      answer,
      evidence,
      organizationId: input.organizationId,
      userId: input.ctx.userId,
    });
    return { verification: result, usedLLM: false };
  });
  stages.push(verificationStage.result);
  const verification = verificationStage.output.verification;

  // STAGE 9: Confidence (uncertainty estimation)
  const confidenceStage = await runStage("confidence", async () => {
    const retrievalQuality = evidence.length > 0
      ? evidence.reduce((s, e) => s + e.relevance, 0) / evidence.length
      : 0;
    const uncertainty = estimateUncertainty({
      evidence,
      sourcesQueried: evidenceGraph.sourcesQueried.length,
      sourcesWithResults: evidenceGraph.sourcesWithResults.length,
      retrievalQuality,
      hasLLMOutput: llmInvoked,
    });
    return { uncertainty, usedLLM: false };
  });
  stages.push(confidenceStage.result);
  const uncertainty = confidenceStage.output.uncertainty;
  const confidence = uncertainty.confidence;

  // STAGE 10: Answer
  const answerStage = await runStage("answer", async () => {
    const explanation = buildExplanation({
      reasoning: `${intent.intent} intent detected. ${explainUncertainty(uncertainty)}`,
      confidence,
      evidence,
      modulesUsed: Array.from(new Set([
        ...intent.requiredSystems,
        ...evidenceGraph.sourcesWithResults,
      ])),
      goalsSupported: goals,
      estimatedCost,
      estimatedTimeSavedMinutes: estimateTimeSaved(intent, llmInvoked),
      decision,
    });
    return { answer, explanation, usedLLM: false };
  });
  stages.push(answerStage.result);
  const explanation: Explanation = answerStage.output.explanation;

  const totalDurationMs = Date.now() - startedAt;
  const modulesUsed = Array.from(new Set([
    ...intent.requiredSystems,
    ...evidenceGraph.sourcesWithResults,
  ]));

  // Record cognitive event for analytics
  await repo.createCognitiveEvent({
    eventType: "reasoning_complete", traceId, userId: input.ctx.userId,
    module: "cognitive-ai",
    payload: { intent: intent.intent, confidence, evidenceCount: evidence.length, llmInvoked },
    durationMs: totalDurationMs, confidence, llmInvoked, costUsd: estimatedCost,
  }).catch(() => { /* best-effort */ });

  // Record episode for future retrieval (if the action was significant)
  if (input.ctx.userId) {
    await recordEpisode({
      scopeType: "user", scopeId: input.ctx.userId, kind: "ai_intervention",
      summary: `Reasoned about: ${input.query.slice(0, 100)}`,
      payload: { intent: intent.intent, confidence, evidenceCount: evidence.length, llmInvoked },
      importance: 0.6,
      tags: [intent.intent, "reasoning"],
    }).catch(() => { /* best-effort */ });
  }

  // Reflect asynchronously (don't block the response)
  if (input.ctx.userId) {
    setImmediate(() => {
      reflectOnAction({
        actionType: "reasoning",
        traceId,
        evidence,
        confidence,
        modulesUsed,
        llmInvoked,
        estimatedCost,
      }).catch(err => log.warn("reflection.failed", { error: (err as Error).message }));
    });
  }

  log.info("reasoning.complete", {
    traceId, durationMs: totalDurationMs, confidence, llmInvoked,
    evidenceCount: evidence.length, cost: estimatedCost,
  });

  return {
    traceId,
    answer,
    stages,
    totalDurationMs,
    confidence,
    evidence,
    modulesUsed,
    goalsSupported: goals.map(g => g.id),
    llmInvoked,
    estimatedCost,
    estimatedTimeSavedMinutes: explanation.estimatedTimeSavedMinutes,
    explanation,
  };
}

// ===========================================================================
// Educational Thinking Frameworks (System 14)
// ===========================================================================

export const THINKING_FRAMEWORKS = {
  teaching: {
    kind: "teaching" as const,
    label: "Teaching Framework",
    stages: [
      { stage: "intent" as const, weight: 0.15 },
      { stage: "knowledge_retrieval" as const, weight: 0.2 },
      { stage: "goal_analysis" as const, weight: 0.15 },
      { stage: "planning" as const, weight: 0.2 },
      { stage: "evidence_collection" as const, weight: 0.1 },
      { stage: "reasoning" as const, weight: 0.15 },
      { stage: "verification" as const, weight: 0.05 },
    ],
    defaultGoals: ["increase_mastery", "improve_engagement", "reduce_teacher_workload"] as const,
    preferredTools: ["ai_workspace.generate", "knowledge_intelligence.extract_concepts", "discovery.recommend"],
    description: "Reasoning flow for teaching tasks — lesson planning, classroom management, pedagogy.",
  },
  assessment: {
    kind: "assessment" as const,
    label: "Assessment Framework",
    stages: [
      { stage: "intent" as const, weight: 0.1 },
      { stage: "knowledge_retrieval" as const, weight: 0.2 },
      { stage: "dependency_analysis" as const, weight: 0.15 },
      { stage: "evidence_collection" as const, weight: 0.2 },
      { stage: "reasoning" as const, weight: 0.2 },
      { stage: "verification" as const, weight: 0.15 },
    ],
    defaultGoals: ["prepare_exam", "increase_mastery"] as const,
    preferredTools: ["assessment_platform.build_assessment", "assessment_platform.grade_essay", "knowledge_intelligence.assess_coverage"],
    description: "Reasoning flow for assessment tasks — question authoring, grading, integrity.",
  },
  planning: {
    kind: "planning" as const,
    label: "Planning Framework",
    stages: [
      { stage: "intent" as const, weight: 0.1 },
      { stage: "knowledge_retrieval" as const, weight: 0.15 },
      { stage: "goal_analysis" as const, weight: 0.2 },
      { stage: "planning" as const, weight: 0.35 },
      { stage: "verification" as const, weight: 0.1 },
      { stage: "confidence" as const, weight: 0.1 },
    ],
    defaultGoals: ["finish_curriculum", "improve_engagement"] as const,
    preferredTools: ["learning_planner.generate_plan", "digital_twins.sync_classroom", "discovery.recommend"],
    description: "Reasoning flow for planning tasks — curriculum, weekly, monthly plans.",
  },
  curriculum: {
    kind: "curriculum" as const,
    label: "Curriculum Framework",
    stages: [
      { stage: "intent" as const, weight: 0.1 },
      { stage: "knowledge_retrieval" as const, weight: 0.3 },
      { stage: "dependency_analysis" as const, weight: 0.2 },
      { stage: "verification" as const, weight: 0.2 },
      { stage: "confidence" as const, weight: 0.2 },
    ],
    defaultGoals: ["finish_curriculum", "increase_mastery"] as const,
    preferredTools: ["knowledge_intelligence.assess_coverage", "knowledge_intelligence.extract_concepts"],
    description: "Reasoning flow for curriculum tasks — alignment, coverage, standards.",
  },
  research: {
    kind: "research" as const,
    label: "Research Framework",
    stages: [
      { stage: "intent" as const, weight: 0.1 },
      { stage: "knowledge_retrieval" as const, weight: 0.35 },
      { stage: "evidence_collection" as const, weight: 0.25 },
      { stage: "reasoning" as const, weight: 0.2 },
      { stage: "confidence" as const, weight: 0.1 },
    ],
    defaultGoals: ["increase_research_output"] as const,
    preferredTools: ["research.literature_review", "discovery.search"],
    description: "Reasoning flow for research tasks — literature, experiments, publications.",
  },
  student_support: {
    kind: "student_support" as const,
    label: "Student Support Framework",
    stages: [
      { stage: "intent" as const, weight: 0.15 },
      { stage: "knowledge_retrieval" as const, weight: 0.2 },
      { stage: "goal_analysis" as const, weight: 0.2 },
      { stage: "planning" as const, weight: 0.2 },
      { stage: "reasoning" as const, weight: 0.15 },
      { stage: "verification" as const, weight: 0.1 },
    ],
    defaultGoals: ["reduce_dropout", "improve_engagement", "increase_mastery"] as const,
    preferredTools: ["digital_twins.identify_at_risk", "learning_planner.generate_plan", "education_os.notify"],
    description: "Reasoning flow for student support — interventions, mentorship, remediation.",
  },
  institution: {
    kind: "institution" as const,
    label: "Institution Framework",
    stages: [
      { stage: "intent" as const, weight: 0.1 },
      { stage: "knowledge_retrieval" as const, weight: 0.2 },
      { stage: "goal_analysis" as const, weight: 0.25 },
      { stage: "planning" as const, weight: 0.2 },
      { stage: "verification" as const, weight: 0.15 },
      { stage: "confidence" as const, weight: 0.1 },
    ],
    defaultGoals: ["reduce_dropout", "finish_curriculum", "reduce_teacher_workload"] as const,
    preferredTools: ["civilization.analyze_decision", "civilization.generate_strategic_plan", "global_intelligence.benchmark"],
    description: "Reasoning flow for institutional decisions — strategy, policy, analytics.",
  },
  marketplace: {
    kind: "marketplace" as const,
    label: "Marketplace Framework",
    stages: [
      { stage: "intent" as const, weight: 0.15 },
      { stage: "knowledge_retrieval" as const, weight: 0.25 },
      { stage: "evidence_collection" as const, weight: 0.2 },
      { stage: "reasoning" as const, weight: 0.25 },
      { stage: "confidence" as const, weight: 0.15 },
    ],
    defaultGoals: ["improve_revenue"] as const,
    preferredTools: ["marketplace.search", "marketplace.optimize_pricing"],
    description: "Reasoning flow for marketplace tasks — listings, pricing, sales.",
  },
};

// ===========================================================================
// Cognitive Analytics (System 17)
// ===========================================================================

export async function getCognitiveAnalytics(): Promise<{
  averageReasoningLatencyMs: number;
  toolUsage: Array<{ tool: string; count: number; averageDurationMs: number }>;
  confidenceDistribution: Array<{ bucket: string; count: number }>;
  averageRetrievalQuality: number;
  verificationFailures: number;
  reflectionFrequency: number;
  memoryUtilization: { working: number; episodic: number; semantic: number };
  goalCompletionRate: number;
  aiSuccessRate: number;
  llmCallsSaved: number;
  generatedAt: string;
}> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await repo.listCognitiveEvents({ since: since24h, limit: 1000 });
  const reasoningEvents = events.filter(e => e.eventType === "reasoning_complete");
  const averageReasoningLatencyMs = reasoningEvents.length > 0
    ? Math.round(reasoningEvents.reduce((s, e) => s + (e.durationMs ?? 0), 0) / reasoningEvents.length)
    : 0;
  const llmEvents = reasoningEvents.filter(e => e.llmInvoked);
  const deterministicEvents = reasoningEvents.filter(e => !e.llmInvoked);
  const confidenceBuckets = new Map<string, number>();
  for (const e of reasoningEvents) {
    const bucket = e.confidence !== null ? Math.floor(e.confidence * 10) / 10 : 0;
    const key = `${bucket.toFixed(1)}-${(bucket + 0.1).toFixed(1)}`;
    confidenceBuckets.set(key, (confidenceBuckets.get(key) ?? 0) + 1);
  }
  const goals = await listGoals().catch(() => []);
  const achievedGoals = goals.filter(g => g.progress >= 100);
  const verificationFailures = events.filter(e => e.eventType === "verification_failed").length;
  const reflections = await repo.listReflections(1000);
  const reflectionFrequency = reflections.length; // per day
  const memoryUtilization = {
    working: await repo.findActiveWorkingMemory("user", "all").then(r => r.length).catch(() => 0),
    episodic: await repo.findEpisodicMemoryByScope("user", "all", 1).then(r => r.length).catch(() => 0),
    semantic: await repo.findSemanticMemory(undefined, undefined, 1).then(r => r.length).catch(() => 0),
  };
  return {
    averageReasoningLatencyMs,
    toolUsage: [], // would require event-level tracking
    confidenceDistribution: Array.from(confidenceBuckets.entries()).map(([bucket, count]) => ({ bucket, count })),
    averageRetrievalQuality: 0, // would require event-level tracking
    verificationFailures,
    reflectionFrequency,
    memoryUtilization,
    goalCompletionRate: goals.length > 0 ? achievedGoals.length / goals.length : 0,
    aiSuccessRate: reasoningEvents.length > 0
      ? reasoningEvents.filter(e => e.confidence !== null && e.confidence > 0.5).length / reasoningEvents.length
      : 0,
    llmCallsSaved: deterministicEvents.length,
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Helpers
// ===========================================================================

async function runStage<T extends { usedLLM: boolean } & Record<string, unknown>>(stage: ReasoningStageResult["stage"], fn: () => Promise<T>): Promise<{ result: ReasoningStageResult; output: T }> {
  const start = Date.now();
  try {
    const output = await fn();
    return {
      result: {
        stage, status: "completed", durationMs: Date.now() - start,
        output: output as Record<string, unknown>, usedLLM: output.usedLLM, notes: [],
      },
      output,
    };
  } catch (err) {
    return {
      result: {
        stage, status: "failed", durationMs: Date.now() - start,
        output: {}, usedLLM: false,
        notes: [(err as Error).message],
      },
      output: {} as T,
    };
  }
}

function buildReasoningPrompt(query: string, intent: string, evidence: EvidenceItem[], goals: CognitiveGoal[]): string {
  const evidenceText = evidence.slice(0, 5).map((e, i) => `${i + 1}. [${e.source}] ${e.content}`).join("\n");
  const goalsText = goals.slice(0, 3).map(g => `- ${g.title}`).join("\n");
  return `You are EduBek's cognitive AI assistant. Answer the user's query using the provided evidence.

User query: ${query}

Detected intent: ${intent}

Evidence:
${evidenceText || "(no evidence available)"}

Active goals:
${goalsText || "(no active goals)"}

Provide a concise, helpful answer grounded in the evidence. If evidence is insufficient, acknowledge the limitation.`;
}

function buildDeterministicAnswer(query: string, intent: { intent: string; confidence: number }, evidence: EvidenceItem[], goals: CognitiveGoal[]): string {
  if (evidence.length === 0) {
    return `I couldn't find specific evidence for "${query.slice(0, 60)}". Could you provide more details or rephrase your question?`;
  }
  const topEvidence = evidence.slice(0, 3).map((e, i) => `${i + 1}. ${e.content}`).join("\n");
  const goalText = goals.length > 0 ? ` This aligns with: ${goals.slice(0, 2).map(g => g.title).join(", ")}.` : "";
  return `Based on ${evidence.length} piece(s) of evidence from ${new Set(evidence.map(e => e.source)).size} source(s):

${topEvidence}

(Confidence: ${(intent.confidence * 100).toFixed(0)}%)${goalText}`;
}

function estimateTimeSaved(intent: { intent: string }, llmInvoked: boolean): number {
  // Rough estimate — AI assistance saves ~5-15 minutes depending on the task
  if (!llmInvoked) return 1;
  if (intent.intent === "create_lesson" || intent.intent === "create_exam") return 15;
  if (intent.intent === "study") return 10;
  if (intent.intent === "research") return 20;
  if (intent.intent === "grade") return 12;
  return 5;
}

export { getPlan };
