/**
 * EduBek — Assistant Orchestrator.
 *
 * Phase 5D.5 System 5: One AI assistant that internally routes to the
 * right Education OS agent (Teacher, Student, Research, Assessment,
 * Curriculum, Organization, Marketplace, Planner). The user never
 * chooses — the orchestrator inspects the user's context, intent, and
 * query to pick the best agent.
 *
 * REUSES:
 *   • Platform Orchestrator's invokeAI for the actual AI call
 *   • Education OS agent registry for agent metadata
 *   • Intent Engine for routing decisions
 */
import { getLogger } from "@/lib/logger";
import type { AuthContext } from "@/features/rbac";
import { invokeAI } from "@/features/platform-orchestrator/ai-workspace";
import type { AssistantAgentKind, AssistantRouting, AssistantResponse } from "./types";
import { detectIntent } from "./intent-engine";
import { buildUnifiedContext } from "./context-engine";
import * as repo from "./repository";

const log = getLogger("assistant-orchestrator");

// ===========================================================================
// Agent metadata — derived from Education OS agent registry
// ===========================================================================

export const AGENT_METADATA: Record<AssistantAgentKind, {
  label: string;
  description: string;
  keywords: string[];
  requiredSubsystems: string[];
}> = {
  teacher: {
    label: "Teacher Agent",
    description: "Pedagogical design, lesson planning, classroom management",
    keywords: ["lesson", "teach", "classroom", "pedagogy", "instruction", "lecture", "curriculum design"],
    requiredSubsystems: ["knowledge-intelligence", "assessment-platform", "ai-workspace"],
  },
  student: {
    label: "Student Agent",
    description: "Study assistance, mastery building, motivation",
    keywords: ["study", "learn", "review", "practice", "homework", "tutor", "explain"],
    requiredSubsystems: ["learning-planner", "discovery", "knowledge-intelligence"],
  },
  research: {
    label: "Research Agent",
    description: "Literature review, hypothesis, experiment design",
    keywords: ["research", "paper", "literature", "experiment", "hypothesis", "citation", "publication"],
    requiredSubsystems: ["research-platform", "global-intelligence"],
  },
  assessment: {
    label: "Assessment Agent",
    description: "Question authoring, rubric design, grading",
    keywords: ["quiz", "exam", "assessment", "question", "grade", "rubric", "score", "test"],
    requiredSubsystems: ["assessment-platform", "knowledge-intelligence"],
  },
  curriculum: {
    label: "Curriculum Agent",
    description: "Curriculum alignment, coverage, standards mapping",
    keywords: ["curriculum", "standard", "framework", "alignment", "coverage", "bloom"],
    requiredSubsystems: ["knowledge-intelligence", "global-intelligence"],
  },
  organization: {
    label: "Organization Agent",
    description: "Institutional operations, strategy, analytics",
    keywords: ["organization", "institution", "strategy", "operations", "policy", "dashboard", "kpi"],
    requiredSubsystems: ["civilization-engine", "platform-intelligence", "digital-twins"],
  },
  marketplace: {
    label: "Marketplace Agent",
    description: "Listing creation, pricing, marketplace intelligence",
    keywords: ["marketplace", "sell", "listing", "price", "purchase", "creator", "earning"],
    requiredSubsystems: ["marketplace", "commerce"],
  },
  planner: {
    label: "Planner Agent",
    description: "Adaptive learning plans, schedules, milestones",
    keywords: ["plan", "schedule", "milestone", "deadline", "agenda", "calendar", "time"],
    requiredSubsystems: ["learning-planner", "digital-twins"],
  },
};

// ===========================================================================
// Public API
// ===========================================================================

export async function routeAssistant(query: string, contextHints?: { roles?: string[] }): Promise<AssistantRouting> {
  // Score each agent by keyword overlap with the query
  const queryLower = query.toLowerCase();
  const scores: Array<{ agent: AssistantAgentKind; score: number; matched: string[] }> = [];
  for (const [agent, meta] of Object.entries(AGENT_METADATA) as Array<[AssistantAgentKind, typeof AGENT_METADATA[AssistantAgentKind]]>) {
    const matched: string[] = [];
    let score = 0;
    for (const kw of meta.keywords) {
      if (queryLower.includes(kw)) {
        score += 1;
        matched.push(kw);
      }
    }
    // Boost score for role alignment
    if (contextHints?.roles) {
      const roleLower = contextHints.roles.join(" ").toLowerCase();
      if (meta.label.toLowerCase().includes("teacher") && roleLower.includes("teacher")) score += 0.5;
      if (meta.label.toLowerCase().includes("student") && roleLower.includes("student")) score += 0.5;
    }
    scores.push({ agent, score, matched });
  }
  scores.sort((a, b) => b.score - a.score);
  const primary = scores[0];
  if (!primary || primary.score === 0) {
    // Default to student agent if no match
    return {
      primaryAgent: "student",
      contributingAgents: [],
      confidence: 0.3,
      rationale: "No specific agent matched the query — defaulting to Student Agent.",
      requiredSubsystems: AGENT_METADATA.student.requiredSubsystems,
    };
  }
  const contributing = scores.slice(1, 3).filter(s => s.score > 0).map(s => s.agent);
  const total = scores.reduce((s, x) => s + x.score, 0);
  const confidence = total === 0 ? 0.5 : Math.min(1, primary.score / total + 0.3);
  return {
    primaryAgent: primary.agent,
    contributingAgents: contributing,
    confidence,
    rationale: `Matched keywords: ${primary.matched.join(", ") || "none"}`,
    requiredSubsystems: AGENT_METADATA[primary.agent].requiredSubsystems,
  };
}

export async function chatWithAssistant(input: {
  ctx: AuthContext;
  organizationId?: string | null;
  classroomId?: string | null;
  query: string;
  traceId?: string;
}): Promise<AssistantResponse> {
  const traceId = input.traceId ?? crypto.randomUUID();
  // 1. Route to the right agent
  const routing = await routeAssistant(input.query, { roles: input.ctx.platformRoles });
  // 2. Detect intent (used to enrich the prompt)
  const intent = await detectIntent({ userId: input.ctx.userId!, query: input.query });
  // 3. Build unified context for the AI
  const context = await buildUnifiedContext({
    ctx: input.ctx,
    organizationId: input.organizationId,
    classroomId: input.classroomId,
    traceId,
    skip: ["research", "globalIntelligence"], // skip less-relevant subsystems for chat
  });
  // 4. Build the agent-specific system prompt
  const agentMeta = AGENT_METADATA[routing.primaryAgent];
  const systemPrompt = `You are EduBek's ${agentMeta.label}. ${agentMeta.description}.

Detected intent: ${intent.intent} (confidence: ${intent.confidence})

User context:
- Roles: ${input.ctx.platformRoles.join(", ")}
- Organization: ${input.organizationId ?? "personal"}
- Classroom: ${input.classroomId ?? "none"}
- Active goals: ${context.planner.activeGoals}
- Streak: ${context.planner.streakDays} days
- Mastery overall: ${context.digitalTwin.topPredictions.length} predictions available

Answer the user's query concisely and helpfully. Suggest concrete next actions when appropriate.`;
  // 5. Invoke AI via Platform Orchestrator
  const result = await invokeAI({
    ctx: input.ctx,
    organizationId: input.organizationId,
    rawPrompt: `${systemPrompt}\n\nUser: ${input.query}`,
    scope: input.classroomId ? { classroomId: input.classroomId } : {},
    traceId,
    skipContext: true, // we already built context above
  });
  // 6. Persist the intent for analytics
  await repo.createIntent({
    userId: input.ctx.userId!,
    query: input.query,
    intent: intent.intent,
    confidence: intent.confidence,
    requiredSystems: intent.requiredSystems,
    requiredAgents: intent.requiredAgents,
    requiredWorkflows: intent.requiredWorkflows,
    recommendedActions: intent.recommendedActions,
    detected: intent.detected,
  }).catch(() => { /* best-effort */ });
  log.info("assistant.invoked", { traceId, agent: routing.primaryAgent, confidence: routing.confidence });
  return {
    traceId,
    routing,
    response: result.response,
    reasoning: result.reasoning,
    followUpActions: result.reasoning.followUpActions,
  };
}

export function listAgents(): Array<{ kind: AssistantAgentKind; label: string; description: string }> {
  return (Object.entries(AGENT_METADATA) as Array<[AssistantAgentKind, typeof AGENT_METADATA[AssistantAgentKind]]>).map(
    ([kind, meta]) => ({ kind, label: meta.label, description: meta.description }),
  );
}
