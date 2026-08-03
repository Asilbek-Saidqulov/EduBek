/**
 * EduBek — Tool Selection (System 6).
 *
 * Instead of manually calling modules, the AI chooses them
 * automatically based on capabilities. No hardcoded chains — selection
 * is capability-based and scored deterministically.
 *
 * Example: "Create exam" → Assessment Builder, Curriculum Mapping,
 * Knowledge Health, Planner, Marketplace, Digital Twin, Notification,
 * Education OS.
 */
import { getLogger } from "@/lib/logger";
import type { ToolDefinition, ToolSelectionResult } from "./types";

const log = getLogger("cognitive-tool-selection");

// ===========================================================================
// Tool catalog — capability descriptions of existing modules
// ===========================================================================

export const TOOL_CATALOG: ToolDefinition[] = [
  // Knowledge Intelligence
  {
    id: "knowledge_intelligence.assess_coverage",
    label: "Assess Curriculum Coverage",
    module: "knowledge-intelligence",
    capability: "Analyze curriculum coverage gaps and weak areas for a classroom or organization",
    inputs: ["classroom_id", "framework_id"],
    outputs: ["coverage_gaps", "weak_topics", "coverage_percent"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "knowledge_intelligence.predict_weak_topics",
    label: "Predict Weak Topics",
    module: "knowledge-intelligence",
    capability: "Predict which topics students will struggle with based on mastery history",
    inputs: ["student_ids", "concept_ids"],
    outputs: ["weak_topics", "confidence_scores"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "knowledge_intelligence.extract_concepts",
    label: "Extract Concepts",
    module: "knowledge-intelligence",
    capability: "Extract concepts from a resource or assessment",
    inputs: ["resource_id"],
    outputs: ["concepts", "bloom_levels", "difficulty"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  // Assessment Platform
  {
    id: "assessment_platform.build_assessment",
    label: "Build Assessment (AI)",
    module: "assessment-platform",
    capability: "Generate a Bloom-balanced assessment blueprint with questions",
    inputs: ["topic", "question_count", "difficulty"],
    outputs: ["blueprint", "questions", "rubric"],
    estimatedCost: 0.02, estimatedDuration: 15, requiresLLM: true,
    requiredPermissions: ["content.create"],
  },
  {
    id: "assessment_platform.grade_essay",
    label: "Grade Essay (AI)",
    module: "assessment-platform",
    capability: "Grade an essay against a rubric with structured feedback",
    inputs: ["essay_text", "rubric"],
    outputs: ["score", "per_criterion_scores", "feedback"],
    estimatedCost: 0.01, estimatedDuration: 10, requiresLLM: true,
    requiredPermissions: ["assessment.grade"],
  },
  {
    id: "assessment_platform.run_integrity_check",
    label: "Run Integrity Check",
    module: "assessment-platform",
    capability: "Check submissions for plagiarism and AI-generated content",
    inputs: ["submission_id"],
    outputs: ["similarity_score", "ai_detection_score", "report"],
    estimatedCost: 0.005, estimatedDuration: 8, requiresLLM: false,
    requiredPermissions: ["assessment.grade"],
  },
  // Learning Planner
  {
    id: "learning_planner.generate_plan",
    label: "Generate Learning Plan",
    module: "learning-planner",
    capability: "Create an adaptive learning plan based on mastery and goals",
    inputs: ["student_id", "goals"],
    outputs: ["plan", "milestones", "schedule"],
    estimatedCost: 0, estimatedDuration: 10, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "learning_planner.schedule_reviews",
    label: "Schedule Spaced Reviews",
    module: "learning-planner",
    capability: "Schedule spaced-repetition review sessions using SM-2",
    inputs: ["student_id", "concept_ids"],
    outputs: ["review_schedule"],
    estimatedCost: 0, estimatedDuration: 3, requiresLLM: false,
    requiredPermissions: [],
  },
  // Discovery
  {
    id: "discovery.search",
    label: "Semantic Search",
    module: "discovery",
    capability: "Search across all resources, concepts, and assessments",
    inputs: ["query"],
    outputs: ["results", "ranked_evidence"],
    estimatedCost: 0, estimatedDuration: 2, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "discovery.recommend",
    label: "Generate Recommendations",
    module: "discovery",
    capability: "Generate personalized recommendations for a user",
    inputs: ["user_id", "context"],
    outputs: ["recommendations"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  // Digital Twins
  {
    id: "digital_twins.sync_classroom",
    label: "Sync Classroom Twin",
    module: "digital-twins",
    capability: "Synchronize the classroom digital twin with current state",
    inputs: ["classroom_id"],
    outputs: ["twin_state", "predictions"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "digital_twins.identify_at_risk",
    label: "Identify At-Risk Students",
    module: "digital-twins",
    capability: "Use the digital twin to identify students at risk of dropout",
    inputs: ["classroom_id"],
    outputs: ["at_risk_students", "risk_factors"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  // Marketplace
  {
    id: "marketplace.search",
    label: "Search Marketplace",
    module: "marketplace",
    capability: "Search marketplace listings for relevant resources",
    inputs: ["query", "content_type"],
    outputs: ["listings"],
    estimatedCost: 0, estimatedDuration: 3, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "marketplace.optimize_pricing",
    label: "Optimize Listing Pricing",
    module: "marketplace",
    capability: "Suggest optimal pricing for a marketplace listing",
    inputs: ["listing_id"],
    outputs: ["price_suggestion", "rationale"],
    estimatedCost: 0.005, estimatedDuration: 8, requiresLLM: true,
    requiredPermissions: ["marketplace.manage"],
  },
  // Education OS
  {
    id: "education_os.notify",
    label: "Notify Agents / Users",
    module: "education-os",
    capability: "Send notifications to users or trigger agent workflows",
    inputs: ["user_ids", "message"],
    outputs: ["notifications_sent"],
    estimatedCost: 0, estimatedDuration: 2, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "education_os.run_workflow",
    label: "Run Education OS Workflow",
    module: "education-os",
    capability: "Execute an Education OS workflow (multi-agent)",
    inputs: ["workflow_type", "inputs"],
    outputs: ["workflow_result"],
    estimatedCost: 0, estimatedDuration: 15, requiresLLM: false,
    requiredPermissions: [],
  },
  // AI Workspace
  {
    id: "ai_workspace.generate",
    label: "AI Generate (LLM)",
    module: "ai-workspace",
    capability: "Generate content using an LLM — lessons, explanations, study guides",
    inputs: ["prompt", "context"],
    outputs: ["generated_content", "reasoning"],
    estimatedCost: 0.02, estimatedDuration: 15, requiresLLM: true,
    requiredPermissions: ["ai.use"],
  },
  {
    id: "ai_workspace.translate",
    label: "Translate Content",
    module: "ai-workspace",
    capability: "Translate content to another language",
    inputs: ["content", "target_language"],
    outputs: ["translated_content"],
    estimatedCost: 0.01, estimatedDuration: 10, requiresLLM: true,
    requiredPermissions: ["ai.use"],
  },
  // Civilization Engine
  {
    id: "civilization.analyze_decision",
    label: "Analyze Institutional Decision",
    module: "civilization-engine",
    capability: "Analyze the impact of an institutional decision",
    inputs: ["decision_type", "parameters"],
    outputs: ["impact_estimates", "confidence", "reasoning"],
    estimatedCost: 0, estimatedDuration: 10, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "civilization.generate_strategic_plan",
    label: "Generate Strategic Plan",
    module: "civilization-engine",
    capability: "Generate a 1/3/5-year strategic plan for an organization",
    inputs: ["organization_id", "horizon"],
    outputs: ["plan", "kpis", "risks"],
    estimatedCost: 0.02, estimatedDuration: 20, requiresLLM: true,
    requiredPermissions: ["organization.manage"],
  },
  // Platform Intelligence
  {
    id: "platform_intelligence.forecast",
    label: "Run Platform Forecast",
    module: "platform-intelligence",
    capability: "Forecast platform metrics (engagement, dropout, revenue)",
    inputs: ["metric", "horizon_days"],
    outputs: ["forecast", "confidence_interval"],
    estimatedCost: 0, estimatedDuration: 5, requiresLLM: false,
    requiredPermissions: [],
  },
  {
    id: "platform_intelligence.run_experiment",
    label: "Run A/B Experiment",
    module: "platform-intelligence",
    capability: "Set up and run an A/B test on a platform parameter",
    inputs: ["parameter", "variants"],
    outputs: ["experiment_id", "results"],
    estimatedCost: 0, estimatedDuration: 10, requiresLLM: false,
    requiredPermissions: ["organization.manage"],
  },
  // Research Platform
  {
    id: "research.literature_review",
    label: "Literature Review (AI)",
    module: "research-platform",
    capability: "Find and summarize relevant literature for a research question",
    inputs: ["research_question"],
    outputs: ["literature_summary", "references"],
    estimatedCost: 0.03, estimatedDuration: 20, requiresLLM: true,
    requiredPermissions: ["ai.use"],
  },
  // Global Intelligence
  {
    id: "global_intelligence.benchmark",
    label: "Global Benchmark",
    module: "global-intelligence",
    capability: "Compare an institution against global benchmarks",
    inputs: ["organization_id", "metrics"],
    outputs: ["benchmark_report", "percentiles"],
    estimatedCost: 0, estimatedDuration: 8, requiresLLM: false,
    requiredPermissions: [],
  },
];

// ===========================================================================
// Public API
// ===========================================================================

export function listTools(module?: string): ToolDefinition[] {
  return module ? TOOL_CATALOG.filter(t => t.module === module) : TOOL_CATALOG;
}

export function getTool(id: string): ToolDefinition | null {
  return TOOL_CATALOG.find(t => t.id === id) ?? null;
}

/**
 * Select tools for a given intent and context. Deterministic — no LLM.
 * Tools are scored by capability match, then filtered by permissions.
 */
export function selectTools(input: {
  intent: string;
  query: string;
  availablePermissions: string[];
  goals?: string[];
}): ToolSelectionResult {
  const { intent, query, availablePermissions, goals } = input;
  const queryLower = query.toLowerCase();
  const scored: Array<{ tool: ToolDefinition; reason: string; score: number }> = [];
  const rejected: Array<{ tool: ToolDefinition; reason: string }> = [];

  for (const tool of TOOL_CATALOG) {
    // Permission filter
    const hasPermission = tool.requiredPermissions.every(p =>
      availablePermissions.includes(p) || availablePermissions.includes("superadmin"),
    );
    if (!hasPermission) {
      rejected.push({ tool, reason: "Missing required permission" });
      continue;
    }
    // Capability match
    let score = 0;
    const reasonParts: string[] = [];
    // Intent-based scoring
    if (intent.includes("exam") || intent.includes("assessment")) {
      if (tool.module === "assessment-platform") { score += 30; reasonParts.push("assessment intent"); }
      if (tool.module === "knowledge-intelligence" && tool.id.includes("coverage")) { score += 20; reasonParts.push("coverage check for assessment"); }
    }
    if (intent.includes("lesson") || intent.includes("curriculum")) {
      if (tool.module === "ai-workspace" && tool.id.includes("generate")) { score += 25; reasonParts.push("lesson generation"); }
      if (tool.module === "knowledge-intelligence") { score += 20; reasonParts.push("curriculum alignment"); }
    }
    if (intent.includes("study") || intent.includes("plan")) {
      if (tool.module === "learning-planner") { score += 30; reasonParts.push("planning intent"); }
      if (tool.module === "discovery" && tool.id.includes("recommend")) { score += 20; reasonParts.push("recommendations for study"); }
    }
    if (intent.includes("research")) {
      if (tool.module === "research-platform") { score += 30; reasonParts.push("research intent"); }
    }
    if (intent.includes("marketplace") || intent.includes("sell")) {
      if (tool.module === "marketplace") { score += 30; reasonParts.push("marketplace intent"); }
    }
    if (intent.includes("analyze") || intent.includes("organization")) {
      if (tool.module === "civilization-engine") { score += 25; reasonParts.push("institutional analysis"); }
      if (tool.module === "platform-intelligence") { score += 20; reasonParts.push("platform analytics"); }
      if (tool.module === "global-intelligence") { score += 15; reasonParts.push("global benchmarking"); }
    }
    if (intent.includes("dropout") || intent.includes("at_risk")) {
      if (tool.module === "digital-twins" && tool.id.includes("at_risk")) { score += 35; reasonParts.push("at-risk detection"); }
    }
    // Keyword match
    for (const kw of queryLower.split(/\s+/)) {
      if (kw.length < 3) continue;
      if (tool.capability.toLowerCase().includes(kw)) { score += 5; reasonParts.push(`keyword "${kw}"`); }
      if (tool.label.toLowerCase().includes(kw)) { score += 5; }
    }
    // Goal alignment
    if (goals && goals.length > 0) {
      for (const g of goals) {
        if (tool.module === "assessment-platform" && g === "prepare_exam") { score += 10; reasonParts.push("supports exam prep goal"); }
        if (tool.module === "learning-planner" && g === "increase_mastery") { score += 10; reasonParts.push("supports mastery goal"); }
        if (tool.module === "digital-twins" && g === "reduce_dropout") { score += 10; reasonParts.push("supports dropout goal"); }
      }
    }
    // Prefer cheaper / faster tools when scores tie
    score -= tool.estimatedCost * 100;
    score -= tool.estimatedDuration * 0.1;

    if (score > 0) {
      scored.push({
        tool, score, reason: reasonParts.length > 0 ? reasonParts.join("; ") : "general match",
      });
    } else {
      rejected.push({ tool, reason: "Low relevance score" });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, 8); // Cap at 8 tools
  const estimatedCost = selected.reduce((s, x) => s + x.tool.estimatedCost, 0);
  const estimatedDuration = selected.reduce((s, x) => s + x.tool.estimatedDuration, 0);
  const llmRequired = selected.some(x => x.tool.requiresLLM);

  log.debug("tools.selected", { intent, selected: selected.length, rejected: rejected.length, llmRequired });
  return { selected, rejected, estimatedCost, estimatedDuration, llmRequired };
}
