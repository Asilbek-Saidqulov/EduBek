/**
 * EduBek — Education OS types.
 *
 * Phase 4F.6: Autonomous Education OS — Multi-Agent AI framework,
 * Agent Coordinator, Shared Agent Memory, Workflow Engine,
 * Automation Engine, Event Bus extensions, Institutional Intelligence,
 * Simulation Engine, AI Reasoning metadata, Executive Analytics.
 *
 * All DTOs are JSON-serializable so they can flow through API routes.
 */

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export type AgentType =
  | "teacher"
  | "student"
  | "curriculum"
  | "assessment"
  | "organization"
  | "marketplace"
  | "planner"
  | "notification"
  | "analytics";

export interface AgentCapability {
  /** Stable capability code, e.g. "lesson_planning". */
  code: string;
  /** Human-readable name. */
  name: string;
  /** i18n key for the name. */
  nameKey: string;
  /** Natural-language description. */
  description: string;
}

export interface AgentDefinition {
  type: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  /** Other agents this agent commonly collaborates with. */
  collaborators: AgentType[];
}

export interface AgentTask {
  /** Stable task code, e.g. "create_lesson", "predict_dropout". */
  code: string;
  /** Natural-language instruction (optional, for chat-style requests). */
  instruction?: string;
  /** Structured parameters. */
  params: Record<string, unknown>;
  /** Required capabilities (used by the coordinator to pick agents). */
  requiredCapabilities?: string[];
  /** Locale for AI-generated text. */
  locale?: string;
}

export interface AgentReasoning {
  /** 0-1 — how confident the agent is in its response. */
  confidence: number;
  /** Natural-language explanation of the reasoning. */
  reasoning: string;
  /** i18n key for the reasoning template. */
  reasoningKey?: string;
  /** Evidence references — IDs of resources, concepts, standards, etc. */
  sources: Array<{
    type: "resource" | "concept" | "standard" | "user" | "classroom" | "organization" | "prediction";
    id: string;
    title: string;
    relevance: number;
  }>;
  /** Modules / subsystems the agent touched or consulted. */
  affectedModules: string[];
  /** Recommended next actions for the caller. */
  recommendedNextActions: Array<{
    code: string;
    description: string;
    descriptionKey?: string;
    priority: number;
  }>;
}

export interface AgentResponse {
  agentType: AgentType;
  task: string;
  /** The agent's primary output — type varies by task. */
  result: unknown;
  reasoning: AgentReasoning;
  executionMs: number;
  status: "completed" | "failed" | "partial";
  error?: string;
}

// ---------------------------------------------------------------------------
// Coordinator
// ---------------------------------------------------------------------------

export interface CoordinatorExecution {
  /** The original task instruction. */
  instruction: string;
  /** Agents the coordinator determined were necessary. */
  participatingAgents: AgentType[];
  /** Each agent's response (in execution order). */
  responses: AgentResponse[];
  /** Merged unified response. */
  unifiedResult: unknown;
  /** Reasoning metadata for the whole execution. */
  reasoning: AgentReasoning;
  /** Total wall-clock execution time in ms. */
  executionMs: number;
  /** Whether shared memory was updated by this execution. */
  memoryUpdated: boolean;
  /** Optional: linked workflow ID. */
  workflowId?: string;
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export type MemoryScopeType = "user" | "classroom" | "organization" | "system";
export type MemoryType = "conversation" | "goal" | "action" | "context" | "workflow";

export interface AgentMemoryDto {
  id: string;
  scopeType: MemoryScopeType;
  scopeId: string;
  type: MemoryType;
  summary: string;
  payload: Record<string, unknown>;
  importance: number;
  agentType: AgentType | null;
  workflowId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  scopeType: MemoryScopeType;
  scopeId: string;
  type: MemoryType;
  summary: string;
  payload?: Record<string, unknown>;
  importance?: number;
  agentType?: AgentType;
  workflowId?: string;
  expiresInDays?: number;
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

export type WorkflowType =
  | "generate_lesson"
  | "create_quiz"
  | "create_homework"
  | "intervention"
  | "curriculum_alignment"
  | "student_support"
  | "marketplace_compare"
  | "full_teaching_cycle";

export interface WorkflowStep {
  id: string;
  /** Agent that runs this step. */
  agent: AgentType;
  /** Task code to execute. */
  task: string;
  /** Step status. */
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  /** When the step started. */
  startedAt?: string;
  /** When the step completed. */
  completedAt?: string;
  /** Step result (JSON). */
  result?: unknown;
  /** Error message if failed. */
  error?: string;
}

export interface WorkflowDefinition {
  type: WorkflowType;
  name: string;
  description: string;
  steps: Array<Omit<WorkflowStep, "id" | "status" | "startedAt" | "completedAt" | "result" | "error">>;
}

export interface WorkflowExecution {
  id: string;
  type: WorkflowType;
  initiatedBy: string;
  scopeType: MemoryScopeType;
  scopeId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  steps: WorkflowStep[];
  result: unknown;
  participatingAgents: AgentType[];
  executionMs: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------

export interface AutomationTrigger {
  /** Event type from the event bus, e.g. "ResourceCreated". */
  event: string;
  /** Optional condition expression, e.g. { "resource.subject": "mathematics" }. */
  conditions?: Record<string, unknown>;
}

export interface AutomationAction {
  /** Stable action code: "assign_review" | "notify_teacher" | "schedule_repetition" | etc. */
  type: string;
  /** Action parameters. */
  params: Record<string, unknown>;
}

export interface AutomationRuleDto {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  scopeType: MemoryScopeType;
  scopeId: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  maxPerHour: number;
  lastFiredAt: string | null;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationInput {
  name: string;
  description?: string;
  scopeType: MemoryScopeType;
  scopeId: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled?: boolean;
  maxPerHour?: number;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface SimulationInput {
  /** Scenario name, e.g. "make_subject_mandatory". */
  scenario: string;
  /** Scenario parameters, e.g. { subject: "algebra", grade: "8" }. */
  params: Record<string, unknown>;
  /** Locale for the AI summary. */
  locale?: string;
}

export interface SimulationPredictions {
  curriculumChanges: number;
  affectedTeachers: number;
  affectedStudents: number;
  newResourcesNeeded: number;
  estimatedAiCredits: number;
  estimatedWorkloadHours: number;
  /** Predicted mastery change (%). */
  predictedMasteryChange: number;
  /** Predicted dropout change (%). */
  predictedDropoutChange: number;
}

export interface SimulationAffected {
  teachers: string[];
  students: string[];
  classrooms: string[];
  resources: string[];
  frameworks: string[];
}

export interface SimulationCosts {
  aiCredits: number;
  workloadHours: number;
  /** Estimated wall-clock time in minutes for full rollout. */
  rolloutMinutes: number;
}

export interface SimulationResultDto {
  id: string;
  scenario: string;
  input: Record<string, unknown>;
  predictions: SimulationPredictions;
  affected: SimulationAffected;
  estimatedCosts: SimulationCosts;
  summary: string;
  confidence: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Institutional Intelligence — Executive dashboards
// ---------------------------------------------------------------------------

export type DashboardLevel = "teacher" | "department" | "school" | "district";

export interface InstitutionalDashboard {
  level: DashboardLevel;
  scopeId: string;
  scopeName: string;
  // Headline metrics
  curriculumCompletion: number;
  knowledgeHealth: number;
  teacherEffectiveness: number;
  studentEngagement: number;
  dropoutRisk: number;
  marketplaceAdoption: number;
  aiUsage: number;
  certificationProgress: number;
  learningVelocity: number;
  // Sub-dashboards by department / classroom
  breakdowns: Array<{
    id: string;
    name: string;
    metric: string;
    value: number;
    trend: "up" | "down" | "flat";
  }>;
  // Weak areas
  weakDepartments: string[];
  weakClassrooms: string[];
  // AI summary
  aiSummary: string;
  aiSummaryKey: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Agent Execution Log
// ---------------------------------------------------------------------------

export interface AgentExecutionLogDto {
  id: string;
  agentType: AgentType;
  task: string;
  input: Record<string, unknown>;
  output: unknown;
  confidence: number | null;
  reasoning: string | null;
  sources: Array<{ type: string; id: string; title: string }> | null;
  affectedModules: string[];
  status: "running" | "completed" | "failed";
  executionMs: number;
  error: string | null;
  scopeType: string | null;
  scopeId: string | null;
  workflowId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Event Bus extensions (Phase 4F.6)
// ---------------------------------------------------------------------------

export type EducationOsEventType =
  | "ResourceCreated"
  | "QuizCompleted"
  | "LessonGenerated"
  | "TranslationCreated"
  | "MarketplacePurchase"
  | "StudySessionCompleted"
  | "KnowledgeHealthUpdated"
  | "OrganizationSnapshotCreated";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export interface EducationOsStatus {
  status: "operational" | "degraded" | "down";
  registeredAgents: AgentType[];
  agentCount: number;
  workflowsExecuted: number;
  automationsEnabled: number;
  memoryEntries: number;
  uptime: string;
  version: string;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export interface EducationOsRecommendation {
  id: string;
  agentType: AgentType;
  type: string;
  title: string;
  description: string;
  reasonKey: string;
  confidence: number;
  priority: number;
  actionItems: string[];
  actionItemKeys: string[];
  estimatedImpactPct: number;
}
