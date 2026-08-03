/**
 * EduBek — Intent Engine.
 *
 * Phase 5D.5 System 10: When a user writes "I need tomorrow's lesson",
 * the system determines the intent, required systems, required agents,
 * required workflows, and recommended actions.
 *
 * Intent detection is keyword + pattern based — we don't call an LLM
 * for every query (that would be slow and expensive). When detection
 * confidence is low, the assistant-orchestrator can fall back to an
 * LLM-based clarification.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { UserIntent, AssistantAgentKind } from "./types";

const log = getLogger("intent-engine");

// ===========================================================================
// Intent definitions
// ===========================================================================

interface IntentDef {
  intent: string;
  label: string;
  keywords: string[];
  requiredSystems: string[];
  requiredAgents: AssistantAgentKind[];
  requiredWorkflows: string[];
  recommendedActions: Array<{ action: string; rationale: string; priority: number }>;
}

const INTENTS: IntentDef[] = [
  {
    intent: "create_lesson",
    label: "Create a lesson",
    keywords: ["lesson", "create lesson", "plan lesson", "tomorrow's lesson", "lecture", "teach"],
    requiredSystems: ["ai-workspace", "knowledge-intelligence", "assessment-platform"],
    requiredAgents: ["teacher", "curriculum"],
    requiredWorkflows: ["resource.created"],
    recommendedActions: [
      { action: "Open AI Workspace to draft the lesson", rationale: "AI can generate a lesson outline from the topic.", priority: 90 },
      { action: "Align lesson to curriculum framework", rationale: "Ensures the lesson meets standards.", priority: 80 },
    ],
  },
  {
    intent: "create_exam",
    label: "Create an exam",
    keywords: ["exam", "test", "quiz", "assessment", "create exam", "make test"],
    requiredSystems: ["assessment-platform", "knowledge-intelligence"],
    requiredAgents: ["assessment", "teacher"],
    requiredWorkflows: ["assessment.published"],
    recommendedActions: [
      { action: "Use Assessment Builder AI", rationale: "Generates Bloom-balanced questions.", priority: 90 },
      { action: "Configure rubric", rationale: "Define grading criteria.", priority: 80 },
    ],
  },
  {
    intent: "study",
    label: "Study",
    keywords: ["study", "learn", "review", "practice", "homework", "prepare"],
    requiredSystems: ["learning-planner", "discovery", "knowledge-intelligence"],
    requiredAgents: ["student", "planner"],
    requiredWorkflows: ["learning.session_completed"],
    recommendedActions: [
      { action: "Open today's learning plan", rationale: "Your planner has the next optimal session.", priority: 90 },
      { action: "Review weak topics first", rationale: "Maximizes learning gains.", priority: 80 },
    ],
  },
  {
    intent: "grade",
    label: "Grade submissions",
    keywords: ["grade", "grading", "score", "submission", "review submission"],
    requiredSystems: ["assessment-platform", "platform-intelligence"],
    requiredAgents: ["assessment", "teacher"],
    requiredWorkflows: ["submission.graded"],
    recommendedActions: [
      { action: "Open grading queue", rationale: "See submissions awaiting review.", priority: 90 },
      { action: "Use AI grading for essays", rationale: "Speeds up grading with rubric-based AI.", priority: 70 },
    ],
  },
  {
    intent: "analyze_org",
    label: "Analyze organization",
    keywords: ["analytics", "organization", "dashboard", "kpi", "performance", "report"],
    requiredSystems: ["civilization-engine", "platform-intelligence", "digital-twins"],
    requiredAgents: ["organization"],
    requiredWorkflows: [],
    recommendedActions: [
      { action: "Open organization dashboard", rationale: "See high-level KPIs.", priority: 90 },
      { action: "Run strategic analysis", rationale: "Get AI-driven recommendations.", priority: 80 },
    ],
  },
  {
    intent: "publish_marketplace",
    label: "Publish to marketplace",
    keywords: ["publish", "marketplace", "sell", "list", "earning"],
    requiredSystems: ["marketplace", "commerce"],
    requiredAgents: ["marketplace"],
    requiredWorkflows: ["listing.published"],
    recommendedActions: [
      { action: "Finalize resource metadata", rationale: "Title, description, tags improve discoverability.", priority: 80 },
      { action: "Set competitive pricing", rationale: "AI can suggest optimal price.", priority: 70 },
    ],
  },
  {
    intent: "research",
    label: "Research",
    keywords: ["research", "paper", "literature", "experiment", "hypothesis", "publication", "study"],
    requiredSystems: ["research-platform", "global-intelligence"],
    requiredAgents: ["research"],
    requiredWorkflows: [],
    recommendedActions: [
      { action: "Open research workspace", rationale: "Manage your project from one place.", priority: 90 },
      { action: "Use AI literature review", rationale: "Quickly find relevant papers.", priority: 80 },
    ],
  },
  {
    intent: "certify",
    label: "Get certified",
    keywords: ["certificate", "certification", "credential", "accredit"],
    requiredSystems: ["assessment-platform"],
    requiredAgents: ["assessment", "student"],
    requiredWorkflows: ["certificate.issued"],
    recommendedActions: [
      { action: "Review competency requirements", rationale: "Know what's required.", priority: 90 },
      { action: "Take practice exam", rationale: "Check readiness.", priority: 80 },
    ],
  },
  {
    intent: "ask_ai",
    label: "Ask AI",
    keywords: ["ai", "help", "explain", "what", "how", "why", "tutor"],
    requiredSystems: ["ai-workspace"],
    requiredAgents: ["student"],
    requiredWorkflows: ["ai.generation_completed"],
    recommendedActions: [
      { action: "Open AI Workspace", rationale: "Start a session with the AI.", priority: 90 },
    ],
  },
];

// ===========================================================================
// Public API
// ===========================================================================

export async function detectIntent(input: { userId: string; query: string }): Promise<UserIntent> {
  const query = input.query.toLowerCase();
  let bestMatch: { def: IntentDef; score: number; matched: string[] } | null = null;

  for (const def of INTENTS) {
    let score = 0;
    const matched: string[] = [];
    for (const kw of def.keywords) {
      if (query.includes(kw)) {
        // Longer keyword matches score higher (more specific)
        score += kw.length;
        matched.push(kw);
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { def, score, matched };
    }
  }

  if (!bestMatch) {
    // Default to "ask_ai" intent
    const fallback = INTENTS.find(i => i.intent === "ask_ai")!;
    log.debug("intent.not_detected", { query: input.query });
    return {
      intent: fallback.intent,
      confidence: 0.3,
      requiredSystems: fallback.requiredSystems,
      requiredAgents: fallback.requiredAgents,
      requiredWorkflows: fallback.requiredWorkflows,
      recommendedActions: fallback.recommendedActions,
      query: input.query,
      detected: false,
    };
  }

  // Confidence = score normalized by query length, capped at 0.95
  const confidence = Math.min(0.95, 0.4 + (bestMatch.score / Math.max(query.length, 1)) * 2);
  log.debug("intent.detected", { intent: bestMatch.def.intent, confidence, matched: bestMatch.matched });

  // Persist for analytics
  await repo.createIntent({
    userId: input.userId,
    query: input.query,
    intent: bestMatch.def.intent,
    confidence,
    requiredSystems: bestMatch.def.requiredSystems,
    requiredAgents: bestMatch.def.requiredAgents,
    requiredWorkflows: bestMatch.def.requiredWorkflows,
    recommendedActions: bestMatch.def.recommendedActions,
    detected: true,
  }).catch(() => { /* best-effort */ });

  return {
    intent: bestMatch.def.intent,
    confidence,
    requiredSystems: bestMatch.def.requiredSystems,
    requiredAgents: bestMatch.def.requiredAgents,
    requiredWorkflows: bestMatch.def.requiredWorkflows,
    recommendedActions: bestMatch.def.recommendedActions,
    query: input.query,
    detected: true,
  };
}

export function listIntents(): Array<{ intent: string; label: string }> {
  return INTENTS.map(i => ({ intent: i.intent, label: i.label }));
}

export async function getRecentIntents(userId: string, limit = 20): Promise<UserIntent[]> {
  const rows = await repo.listIntents(userId, limit);
  return rows.map(r => ({
    intent: r.intent,
    confidence: r.confidence,
    requiredSystems: repo.safeParse(r.requiredSystems, []),
    requiredAgents: repo.safeParse(r.requiredAgents, []),
    requiredWorkflows: repo.safeParse(r.requiredWorkflows, []),
    recommendedActions: repo.safeParse(r.recommendedActions, []),
    query: r.query,
    detected: r.detected,
  }));
}
