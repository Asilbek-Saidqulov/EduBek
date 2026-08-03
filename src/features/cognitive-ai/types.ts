/**
 * EduBek — Cognitive AI types.
 *
 * Phase 5D.6: A cognitive AI layer that orchestrates existing modules
 * (Platform Orchestrator, Education OS, Digital Twins, Knowledge Graph,
 * Learning Planner, Discovery, Assessment, Marketplace, Research,
 * Civilization Engine, Global Intelligence, Platform Intelligence,
 * Product Intelligence, Cloud Infrastructure, Data Fabric) into a
 * unified "brain" with multi-level memory, long-horizon planning,
 * layered reasoning, goal understanding, reflection, uncertainty
 * estimation, verification, tool selection, decision evaluation,
 * explainability, and meta-cognition.
 *
 * No new domain capabilities — every type here describes a *cognitive*
 * surface that reuses services from earlier phases.
 */

// ===========================================================================
// SYSTEM 1 — Multi-Level Memory
// ===========================================================================

export type MemoryLevel = "working" | "episodic" | "semantic";

export interface WorkingMemoryEntry {
  id: string;
  /** Scope: user, classroom, organization, or session. */
  scopeType: "user" | "classroom" | "organization" | "session";
  scopeId: string;
  /** What kind of context is held. */
  kind: "conversation" | "current_classroom" | "current_workflow" | "current_task" | "transient_facts";
  /** The memory content (structured). */
  payload: Record<string, unknown>;
  /** When the entry was created. */
  createdAt: string;
  /** When the entry expires (auto-evicted after this time). */
  expiresAt: string;
}

export interface EpisodicMemoryEntry {
  id: string;
  /** Scope: user, classroom, organization, or system. */
  scopeType: "user" | "classroom" | "organization" | "system";
  scopeId: string;
  /** Episode kind. */
  kind: "teacher_action" | "student_milestone" | "organization_decision" | "ai_intervention" | "workflow_execution";
  /** Natural-language summary of the episode. */
  summary: string;
  /** Structured payload. */
  payload: Record<string, unknown>;
  /** Importance 0..1 (higher = retained longer). */
  importance: number;
  /** Linked entities (entityType → entityId). */
  linkedEntities: Array<{ entityType: string; entityId: string }>;
  /** When the episode occurred. */
  occurredAt: string;
  /** When the memory was recorded. */
  createdAt: string;
  /** Tags for retrieval. */
  tags: string[];
}

export interface SemanticMemoryEntry {
  id: string;
  /** Domain: 'teaching' | 'curriculum' | 'assessment' | 'platform' | 'research' | 'marketplace'. */
  domain: string;
  /** Knowledge kind: 'principle' | 'strategy' | 'best_practice' | 'fact' | 'policy'. */
  kind: string;
  /** The generalized knowledge statement. */
  statement: string;
  /** Detailed explanation. */
  explanation: string;
  /** Source (which subsystem or episode this was derived from). */
  source: string;
  /** Confidence 0..1. */
  confidence: number;
  /** Tags for retrieval. */
  tags: string[];
  /** When the memory was created. */
  createdAt: string;
  /** When the memory was last accessed. */
  lastAccessedAt: string;
}

export interface MemoryRetrievalResult<T = unknown> {
  entries: T[];
  /** Total entries before pagination. */
  total: number;
  /** Relevance scores 0..1 (aligned with entries). */
  scores: number[];
}

// ===========================================================================
// SYSTEM 2 — Long-Horizon Planning
// ===========================================================================

export interface PlanningGraph {
  id: string;
  /** Plan objective (natural language). */
  objective: string;
  /** All nodes in the plan. */
  nodes: PlanNode[];
  /** Dependencies between nodes. */
  dependencies: Array<{ from: string; to: string; type: "requires" | "informs" | "enables" }>;
  /** Topological execution order (node ids). */
  executionOrder: string[];
  /** Total estimated cost in USD. */
  estimatedCost: number;
  /** Total estimated duration in minutes. */
  estimatedDuration: number;
  /** Overall plan confidence 0..1. */
  confidence: number;
  /** Goals this plan supports. */
  supportedGoals: string[];
  /** When the plan was created. */
  createdAt: string;
}

export interface PlanNode {
  id: string;
  /** Step label. */
  label: string;
  /** Module that owns this step. */
  module: string;
  /** Action to perform. */
  action: string;
  /** Estimated cost in USD. */
  estimatedCost: number;
  /** Estimated duration in minutes. */
  estimatedDuration: number;
  /** Node confidence 0..1. */
  confidence: number;
  /** Whether the node requires an LLM call. */
  requiresLLM: boolean;
  /** Inputs the node needs (from dependencies). */
  inputs: string[];
  /** Outputs the node produces. */
  outputs: string[];
  /** Status of the node. */
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
}

// ===========================================================================
// SYSTEM 3 — Goal Engine
// ===========================================================================

export type GoalKind =
  | "increase_mastery"
  | "reduce_dropout"
  | "improve_engagement"
  | "prepare_sat"
  | "finish_curriculum"
  | "prepare_exam"
  | "reduce_teacher_workload"
  | "improve_revenue"
  | "increase_research_output"
  | "custom";

export interface CognitiveGoal {
  id: string;
  kind: GoalKind;
  title: string;
  description: string;
  /** Measurable target. */
  target: { metric: string; baseline: number; target: number; current: number; unit: string };
  /** Priority 0..100 (higher = more important). */
  priority: number;
  /** Conflicts with other goals (mutually exclusive). */
  conflictsWith: string[];
  /** Modules that contribute to this goal. */
  contributingModules: string[];
  /** Progress 0..100. */
  progress: number;
  /** When the goal was created. */
  createdAt: string;
  /** When the goal was last updated. */
  updatedAt: string;
}

// ===========================================================================
// SYSTEM 4 — Cognitive Reasoning Engine
// ===========================================================================

export type ReasoningStage =
  | "intent" | "knowledge_retrieval" | "dependency_analysis"
  | "goal_analysis" | "planning" | "evidence_collection"
  | "reasoning" | "verification" | "confidence" | "answer";

export interface ReasoningStageResult {
  stage: ReasoningStage;
  status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
  /** Duration in ms. */
  durationMs: number;
  /** Stage output (structured). */
  output: Record<string, unknown>;
  /** Whether the stage required an LLM call. */
  usedLLM: boolean;
  /** Stage-specific notes. */
  notes: string[];
}

export interface CognitiveReasoningResult {
  traceId: string;
  /** The final answer (natural language). */
  answer: string;
  /** All stage results in execution order. */
  stages: ReasoningStageResult[];
  /** Total reasoning duration in ms. */
  totalDurationMs: number;
  /** Final confidence 0..1. */
  confidence: number;
  /** Evidence collected during reasoning. */
  evidence: EvidenceItem[];
  /** Modules used during reasoning. */
  modulesUsed: string[];
  /** Goals supported by the answer. */
  goalsSupported: string[];
  /** Whether any LLM call was made. */
  llmInvoked: boolean;
  /** Estimated cost in USD. */
  estimatedCost: number;
  /** Estimated time saved in minutes. */
  estimatedTimeSavedMinutes: number;
}

// ===========================================================================
// SYSTEM 5 — Knowledge Retrieval
// ===========================================================================

export interface EvidenceItem {
  id: string;
  /** Source module. */
  source: string;
  /** Evidence type. */
  type: "fact" | "statistic" | "policy" | "best_practice" | "observation" | "prediction" | "citation";
  /** Natural-language content. */
  content: string;
  /** Relevance to the query 0..1. */
  relevance: number;
  /** Confidence in the evidence 0..1. */
  confidence: number;
  /** When the evidence was produced (ISO). */
  timestamp: string;
  /** Optional entity reference. */
  entityId?: string;
  /** Optional URL. */
  url?: string;
}

export interface EvidenceGraph {
  /** Original query. */
  query: string;
  /** All evidence items. */
  evidence: EvidenceItem[];
  /** Cross-evidence relationships. */
  relations: Array<{ fromEvidenceId: string; toEvidenceId: string; type: "supports" | "contradicts" | "extends" | "supersedes" }>;
  /** Sources queried. */
  sourcesQueried: string[];
  /** Sources that returned results. */
  sourcesWithResults: string[];
  /** Duplicate items removed. */
  duplicatesRemoved: number;
  /** Total retrieval duration in ms. */
  retrievalDurationMs: number;
}

// ===========================================================================
// SYSTEM 6 — Tool Selection
// ===========================================================================

export interface ToolDefinition {
  id: string;
  /** Display label. */
  label: string;
  /** Module that owns the tool. */
  module: string;
  /** What the tool can do. */
  capability: string;
  /** Input schema (variable names). */
  inputs: string[];
  /** Output schema (variable names). */
  outputs: string[];
  /** Estimated cost in USD. */
  estimatedCost: number;
  /** Estimated duration in minutes. */
  estimatedDuration: number;
  /** Whether the tool requires an LLM call. */
  requiresLLM: boolean;
  /** Required permissions. */
  requiredPermissions: string[];
}

export interface ToolSelectionResult {
  /** Selected tools in execution order. */
  selected: Array<{ tool: ToolDefinition; reason: string; score: number }>;
  /** Tools considered but not selected. */
  rejected: Array<{ tool: ToolDefinition; reason: string }>;
  /** Total estimated cost. */
  estimatedCost: number;
  /** Total estimated duration. */
  estimatedDuration: number;
  /** Whether any tool requires an LLM. */
  llmRequired: boolean;
}

// ===========================================================================
// SYSTEM 7 — Decision Engine
// ===========================================================================

export interface DecisionOption {
  id: string;
  /** Option label. */
  label: string;
  /** Module that would execute this option. */
  module: string;
  /** Brief description. */
  description: string;
  /** Per-criterion scores 0..100 (higher = better). */
  scores: {
    quality: number;
    cost: number; // inverted — higher score = lower cost
    teacherWorkload: number; // inverted — higher score = less workload
    studentImpact: number;
    curriculumFit: number;
  };
  /** Overall weighted score 0..100. */
  overallScore: number;
  /** Estimated cost in USD. */
  estimatedCost: number;
  /** Estimated duration in minutes. */
  estimatedDuration: number;
  /** Risks identified. */
  risks: string[];
}

export interface DecisionResult {
  /** All evaluated options. */
  options: DecisionOption[];
  /** Winning option id. */
  chosenOptionId: string;
  /** Why this option was chosen. */
  rationale: string;
  /** Confidence in the decision 0..1. */
  confidence: number;
}

// ===========================================================================
// SYSTEM 8 — Uncertainty Engine
// ===========================================================================

export interface UncertaintyEstimate {
  /** Overall confidence 0..1. */
  confidence: number;
  /** Reasons the confidence is not 1.0. */
  reasons: Array<{ kind: UncertaintyKind; description: string; severity: number }>;
  /** Missing information that would increase confidence. */
  missingInformation: string[];
  /** Suggested next questions for the user. */
  suggestedNextQuestions: string[];
}

export type UncertaintyKind =
  | "missing_data" | "conflicting_evidence" | "weak_confidence"
  | "stale_information" | "insufficient_history" | "unknown_curriculum"
  | "ambiguous_intent" | "low_retrieval_quality";

// ===========================================================================
// SYSTEM 9 — Verification Engine
// ===========================================================================

export interface VerificationResult {
  /** Overall verification status. */
  status: "verified" | "inconsistencies_found" | "repaired" | "failed";
  /** Per-check results. */
  checks: VerificationCheck[];
  /** Repairs applied automatically. */
  repairs: Array<{ check: string; action: string; success: boolean }>;
  /** Whether the answer can be delivered. */
  canDeliver: boolean;
}

export interface VerificationCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  /** What was checked. */
  description: string;
  /** What was found. */
  details: string;
}

// ===========================================================================
// SYSTEM 10 — Reflection Engine
// ===========================================================================

export interface ReflectionEntry {
  id: string;
  /** Action being reflected on. */
  actionType: string;
  /** Action trace id. */
  traceId: string;
  /** Reflection questions and answers. */
  reflections: Array<{ question: string; answer: string; score: number }>;
  /** Overall reflection score 0..1 (higher = better). */
  overallScore: number;
  /** Lessons learned. */
  lessons: string[];
  /** Whether memory should be updated. */
  memoryUpdateRecommended: boolean;
  /** When the reflection was generated. */
  createdAt: string;
}

// ===========================================================================
// SYSTEM 11 — Continuous Learning Loop
// ===========================================================================

export interface LearningLoopUpdate {
  /** What was learned. */
  learning: string;
  /** Which subsystem the learning applies to. */
  target: "tool_selection" | "planning" | "reasoning" | "goal_ranking" | "confidence_estimation";
  /** The change applied. */
  change: Record<string, unknown>;
  /** Confidence in the learning 0..1. */
  confidence: number;
  /** Source of the learning. */
  source: string;
  /** When the learning was applied. */
  appliedAt: string;
}

// ===========================================================================
// SYSTEM 12 — Explainability Engine
// ===========================================================================

export interface Explanation {
  /** Natural-language reasoning. */
  reasoning: string;
  /** Confidence 0..1. */
  confidence: number;
  /** Evidence cited. */
  evidence: EvidenceItem[];
  /** Modules used. */
  modulesUsed: string[];
  /** Goals supported. */
  goalsSupported: string[];
  /** Estimated cost in USD. */
  cost: number;
  /** Estimated time saved in minutes. */
  estimatedTimeSavedMinutes: number;
  /** Alternative options that were considered. */
  alternativeOptions: Array<{ label: string; whyRejected: string }>;
  /** Why this choice was made. */
  whyThisChoice: string;
}

// ===========================================================================
// SYSTEM 13 — Conversation State
// ===========================================================================

export interface ConversationState {
  id: string;
  userId: string;
  /** Conversation objective (natural language). */
  objective: string | null;
  /** Current task being worked on. */
  currentTask: string | null;
  /** Entities mentioned in the conversation. */
  entities: Array<{ type: string; id: string; label: string }>;
  /** Assumptions made by the AI. */
  assumptions: string[];
  /** Pending questions for the user. */
  pendingQuestions: string[];
  /** Follow-up opportunities. */
  followUpOpportunities: Array<{ label: string; rationale: string; priority: number }>;
  /** Last message timestamp. */
  lastMessageAt: string;
  /** When the conversation was created. */
  createdAt: string;
  /** When the conversation was last updated. */
  updatedAt: string;
}

// ===========================================================================
// SYSTEM 14 — Educational Thinking Frameworks
// ===========================================================================

export type ThinkingFrameworkKind =
  | "teaching" | "assessment" | "planning" | "curriculum"
  | "research" | "student_support" | "institution" | "marketplace";

export interface ThinkingFramework {
  kind: ThinkingFrameworkKind;
  label: string;
  /** Ordered reasoning stages for this framework. */
  stages: Array<{ stage: ReasoningStage; weight: number }>;
  /** Default goals this framework supports. */
  defaultGoals: GoalKind[];
  /** Default tools this framework prefers. */
  preferredTools: string[];
  /** Description. */
  description: string;
}

// ===========================================================================
// SYSTEM 15 — Meta-Cognition
// ===========================================================================

export interface MetaCognitionAssessment {
  /** Detected issues. */
  issues: Array<{ kind: MetaCognitionIssueKind; severity: number; description: string; recommendation: string }>;
  /** Overall self-assessment score 0..1 (higher = better). */
  selfScore: number;
  /** Whether execution should be adjusted. */
  adjustmentRecommended: boolean;
  /** Recommended adjustments. */
  adjustments: string[];
}

export type MetaCognitionIssueKind =
  | "overconfidence" | "repetition" | "looping" | "contradiction"
  | "tool_misuse" | "expensive_reasoning" | "low_value_ai_call";

// ===========================================================================
// SYSTEM 16 — Autonomous Delegation
// ===========================================================================

export interface DelegationRequest {
  id: string;
  /** Parent task being delegated. */
  parentTask: string;
  /** Subtask being delegated. */
  subtask: string;
  /** Agent or module to delegate to. */
  delegate: string;
  /** Inputs for the subtask. */
  inputs: Record<string, unknown>;
  /** Status of the delegation. */
  status: "pending" | "in_progress" | "completed" | "failed";
  /** Result of the subtask. */
  result: Record<string, unknown> | null;
  /** When the delegation was created. */
  createdAt: string;
  /** When the delegation was completed. */
  completedAt: string | null;
}

// ===========================================================================
// SYSTEM 17 — Cognitive Analytics
// ===========================================================================

export interface CognitiveAnalyticsReport {
  /** Average reasoning latency in ms. */
  averageReasoningLatencyMs: number;
  /** Tool usage counts. */
  toolUsage: Array<{ tool: string; count: number; averageDurationMs: number }>;
  /** Confidence distribution (buckets of 0.1). */
  confidenceDistribution: Array<{ bucket: string; count: number }>;
  /** Average retrieval quality 0..1. */
  averageRetrievalQuality: number;
  /** Average planning quality 0..1. */
  averagePlanningQuality: number;
  /** Verification failure count. */
  verificationFailures: number;
  /** Reflection frequency (reflections per day). */
  reflectionFrequency: number;
  /** Memory utilization (entries per level). */
  memoryUtilization: { working: number; episodic: number; semantic: number };
  /** Goal completion rate 0..1. */
  goalCompletionRate: number;
  /** AI success rate 0..1. */
  aiSuccessRate: number;
  /** LLM calls saved by deterministic shortcuts. */
  llmCallsSaved: number;
  /** Generated at. */
  generatedAt: string;
}

// ===========================================================================
// SYSTEM 18 — Production Integration (Orchestrator status)
// ===========================================================================

export interface CognitiveContextSnapshot {
  traceId: string;
  /** Conversation state (if any). */
  conversationState: ConversationState | null;
  /** Working memory entries currently active. */
  workingMemory: WorkingMemoryEntry[];
  /** Active goals. */
  activeGoals: CognitiveGoal[];
  /** Current plan (if mid-planning). */
  currentPlan: PlanningGraph | null;
  /** Recent reflections. */
  recentReflections: ReflectionEntry[];
  /** When the snapshot was assembled. */
  assembledAt: string;
}
