/**
 * EduBek — Product Intelligence types.
 *
 * Phase 5D.5: Experience orchestration layer that turns EduBek from a
 * collection of powerful systems into one coherent product. Every type
 * here describes an *experience* surface — context, journey, workspace,
 * attention, assistant routing, smart actions, adaptive UI, navigation,
 * intent, memory, and product analytics.
 *
 * No new domain capabilities — every type reuses services from earlier
 * phases (Platform Orchestrator, Education OS, Digital Twins, Knowledge
 * Graph, Learning Planner, Discovery, Assessment Platform, Platform
 * Intelligence, Civilization Engine, Global Intelligence, Cloud
 * Infrastructure, Data Fabric).
 */

// ===========================================================================
// SYSTEM 1 — Unified User Context
// ===========================================================================

/** Aggregated product context for a single user request. */
export interface UnifiedProductContext {
  /** Trace id propagated from Platform Orchestrator. */
  traceId: string;
  /** Auth snapshot. */
  user: {
    id: string;
    email?: string;
    locale?: string;
    roles: string[];
    isSuperadmin: boolean;
  };
  /** Primary organization context (may be null for personal-scope users). */
  organization: OrganizationContext | null;
  /** Active classroom scope (may be null). */
  classroom: ClassroomContext | null;
  /** Effective permissions summary. */
  permissions: PermissionSummary;
  /** Curriculum alignment snapshot. */
  curriculum: CurriculumContext;
  /** Active learning goals. */
  learningGoals: LearningGoalContext;
  /** Active assignments. */
  activeAssignments: ActiveAssignmentContext;
  /** Personalized recommendations. */
  recommendations: RecommendationContext;
  /** Recent AI history. */
  aiHistory: AIHistoryContext;
  /** Digital twin summary. */
  digitalTwin: DigitalTwinSummary;
  /** Planner summary. */
  planner: PlannerSummary;
  /** Current workflow (if user is mid-flow). */
  currentWorkflow: CurrentWorkflowContext | null;
  /** Open drafts (workspace state). */
  openDrafts: DraftSummary[];
  /** Notifications needing attention. */
  notifications: NotificationContext;
  /** Product memory snapshot. */
  productMemory: ProductMemorySnapshot;
  /** When the context was assembled. */
  assembledAt: string;
}

export interface OrganizationContext {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

export interface ClassroomContext {
  id: string;
  name: string;
  role: "teacher" | "student" | "ta";
  studentCount: number;
  activeAssignmentCount: number;
}

export interface PermissionSummary {
  /** High-level capability flags derived from RBAC. */
  canCreate: boolean;
  canGrade: boolean;
  canPublish: boolean;
  canManageOrg: boolean;
  canViewAnalytics: boolean;
  canUseAI: boolean;
  /** Total distinct permissions granted. */
  total: number;
}

export interface CurriculumContext {
  conceptsCovered: number;
  frameworksAligned: string[];
  coveragePercent: number;
  pendingTopics: string[];
}

export interface LearningGoalContext {
  activeGoals: number;
  completedGoals: number;
  overdueTasks: number;
  nextMilestone: { title: string; date: string } | null;
}

export interface ActiveAssignmentContext {
  /** Assignments awaiting the user's action (as student or teacher). */
  asStudent: number;
  asTeacher: number;
  /** Soonest due assignment. */
  nextDue: { id: string; title: string; dueAt: string } | null;
}

export interface RecommendationContext {
  personalized: Array<{ id: string; title: string; score: number; reason: string }>;
  nextSteps: Array<{ id: string; title: string; type: string }>;
}

export interface AIHistoryContext {
  sessionsToday: number;
  totalSessions: number;
  lastPrompt: string | null;
  lastInvocationAt: string | null;
}

export interface DigitalTwinSummary {
  twinType: "student" | "teacher" | "classroom" | "institution" | null;
  twinId: string | null;
  /** Top 3 predictions derived from twin state. */
  topPredictions: Array<{ kind: string; value: number; confidence: number }>;
  lastSyncedAt: string | null;
}

export interface PlannerSummary {
  activeGoals: number;
  streakDays: number;
  burnoutRisk: number;
  completionRate: number;
  nextMilestone: { title: string; date: string } | null;
}

export interface CurrentWorkflowContext {
  workflowId: string;
  stepIndex: number;
  totalSteps: number;
  startedAt: string;
}

export interface DraftSummary {
  id: string;
  kind: string;
  title: string;
  updatedAt: string;
  /** Whether the draft is autosaved. */
  autosaved: boolean;
}

export interface NotificationContext {
  unread: number;
  highPriority: number;
  latest: Array<{ id: string; type: string; title: string; createdAt: string; priority: number }>;
}

export interface ProductMemorySnapshot {
  favoriteViews: string[];
  hiddenWidgets: string[];
  dashboardLayout: Record<string, unknown>;
  preferredAIStyle: string;
  lastVisitedPages: string[];
}

// ===========================================================================
// SYSTEM 2 — Journey Engine
// ===========================================================================

export type JourneyKind =
  | "teacher_lesson_creation"
  | "teacher_exam_preparation"
  | "student_studying"
  | "student_reviewing"
  | "organization_analytics"
  | "marketplace_publishing"
  | "research"
  | "certification";

export interface JourneyState {
  kind: JourneyKind;
  /** Display label. */
  title: string;
  /** 0..100 progress estimate. */
  completionPercent: number;
  /** Estimated remaining work in minutes. */
  estimatedRemainingMinutes: number;
  /** Current step index. */
  currentStepIndex: number;
  /** All steps in the journey. */
  steps: JourneyStep[];
  /** AI suggestions for next actions. */
  suggestions: Array<{ action: string; rationale: string; priority: number }>;
  /** Steps blocked by missing prerequisites. */
  blockedSteps: Array<{ stepIndex: number; reason: string }>;
  /** When the journey was started. */
  startedAt: string;
  /** When the journey was last updated. */
  updatedAt: string;
}

export interface JourneyStep {
  index: number;
  label: string;
  status: "pending" | "in_progress" | "completed" | "blocked" | "skipped";
  /** Module that owns this step. */
  module: string;
  /** Optional action URL. */
  actionUrl?: string;
  /** Whether this step requires AI assistance. */
  aiAssisted: boolean;
}

// ===========================================================================
// SYSTEM 3 — Workspace Manager
// ===========================================================================

export interface WorkspaceState {
  id: string;
  userId: string;
  /** Workspace kind (lesson, exam, study, analytics, etc.). */
  kind: string;
  title: string;
  /** Open tabs in the workspace. */
  tabs: WorkspaceTab[];
  /** History of user actions in this workspace. */
  history: WorkspaceHistoryEntry[];
  /** Undo stack (most recent first). */
  undoStack: WorkspaceUndoEntry[];
  /** Draft payload (kind-specific). */
  draft: Record<string, unknown>;
  /** Whether the workspace is currently active. */
  active: boolean;
  /** Autosave state. */
  autosavedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTab {
  id: string;
  label: string;
  /** Tab kind (resource, ai_session, settings, etc.). */
  kind: string;
  /** Optional entity reference. */
  entityId?: string;
  /** Whether the tab has unsaved changes. */
  dirty: boolean;
  /** Tab order in the workspace bar. */
  order: number;
}

export interface WorkspaceHistoryEntry {
  action: string;
  module: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface WorkspaceUndoEntry {
  action: string;
  /** Function identifier the client uses to undo this entry. */
  undoToken: string;
  /** Snapshot of state before the action. */
  beforeState: Record<string, unknown>;
  timestamp: string;
}

// ===========================================================================
// SYSTEM 4 — Attention Engine
// ===========================================================================

export type AttentionKind =
  | "student_at_risk"
  | "pending_grading"
  | "curriculum_delay"
  | "upcoming_exam"
  | "marketplace_sale"
  | "unread_discussion"
  | "ai_generation_waiting"
  | "expired_certificate"
  | "overdue_assignment"
  | "platform_alert";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  title: string;
  description: string;
  /** Priority score 0..100 (higher = more important). */
  priority: number;
  /** When the item was created / detected. */
  detectedAt: string;
  /** Optional entity reference. */
  entityId?: string;
  /** Optional module that produced the item. */
  module?: string;
  /** Whether the item requires immediate action. */
  requiresAction: boolean;
  /** Suggested action. */
  suggestedAction?: { label: string; url?: string };
  /** User the item is for. */
  userId: string;
}

export interface AttentionReport {
  /** All items needing attention, sorted by priority. */
  items: AttentionItem[];
  /** Top 5 critical items. */
  criticalItems: AttentionItem[];
  /** Count per kind. */
  countsByKind: Record<AttentionKind, number>;
  /** Total items needing attention. */
  total: number;
  /** Generated at. */
  generatedAt: string;
}

// ===========================================================================
// SYSTEM 5 — Assistant Orchestrator
// ===========================================================================

export type AssistantAgentKind =
  | "teacher"
  | "student"
  | "research"
  | "assessment"
  | "curriculum"
  | "organization"
  | "marketplace"
  | "planner";

export interface AssistantRouting {
  /** Detected agent kind (single primary). */
  primaryAgent: AssistantAgentKind;
  /** Other agents that may contribute. */
  contributingAgents: AssistantAgentKind[];
  /** Routing confidence 0..1. */
  confidence: number;
  /** Why this agent was chosen. */
  rationale: string;
  /** Required context subsystems. */
  requiredSubsystems: string[];
}

export interface AssistantResponse {
  traceId: string;
  routing: AssistantRouting;
  /** Natural-language response. */
  response: string;
  /** Reasoning metadata from Platform Orchestrator. */
  reasoning: import("@/features/platform-orchestrator/types").ReasoningMetadata;
  /** Suggested follow-up actions. */
  followUpActions: Array<{ action: string; rationale: string; priority: number }>;
}

// ===========================================================================
// SYSTEM 6 — Smart Actions
// ===========================================================================

export interface SmartAction {
  id: string;
  /** Action label for the UI. */
  label: string;
  /** Action description. */
  description: string;
  /** Icon hint (semantic — frontend maps to icon set). */
  icon: string;
  /** Action category. */
  category: "generate" | "notify" | "schedule" | "recommend" | "create" | "navigate" | "analyze";
  /** Module that owns the action. */
  module: string;
  /** Action URL (POST endpoint). */
  url?: string;
  /** Priority 0..100 (higher = more prominent). */
  priority: number;
  /** Required permission. */
  requiredPermission?: string;
  /** Whether AI assistance is required. */
  aiAssisted: boolean;
  /** Estimated time to complete (minutes). */
  estimatedMinutes: number;
}

export interface SmartActionSet {
  /** Entity type the actions are for (e.g. "assessment", "lesson"). */
  entityType: string;
  /** Entity id (if applicable). */
  entityId?: string;
  /** Generated actions, sorted by priority. */
  actions: SmartAction[];
  /** Total actions generated. */
  total: number;
}

// ===========================================================================
// SYSTEM 7 — Adaptive Interface
// ===========================================================================

export interface AdaptiveInterface {
  /** Recommended dashboard widgets in display order. */
  recommendedWidgets: AdaptiveWidget[];
  /** Sections that should be collapsed by default. */
  collapsedSections: string[];
  /** Cards that should be highlighted as important. */
  importantCards: AdaptiveCard[];
  /** Dashboard module ordering. */
  dashboardOrder: string[];
  /** Quick actions for the current context. */
  quickActions: AdaptiveQuickAction[];
  /** Why the layout was chosen. */
  rationale: string;
}

export interface AdaptiveWidget {
  id: string;
  /** Widget type (calendar, queue, recommendations, etc.). */
  type: string;
  title: string;
  /** Suggested size in the grid. */
  size: "small" | "medium" | "large" | "full";
  /** Priority (higher = more prominent). */
  priority: number;
  /** Optional entity scope. */
  scope?: Record<string, string>;
}

export interface AdaptiveCard {
  id: string;
  title: string;
  /** Card kind (alert, insight, suggestion, etc.). */
  kind: string;
  priority: number;
  /** TTL in seconds — when the card should auto-dismiss. */
  ttlSeconds?: number;
}

export interface AdaptiveQuickAction {
  id: string;
  label: string;
  url?: string;
  icon: string;
  priority: number;
}

// ===========================================================================
// SYSTEM 8 — Notification Intelligence
// ===========================================================================

export interface NotificationCluster {
  id: string;
  /** Cluster title (summarized). */
  title: string;
  /** Summarized body. */
  body: string;
  /** Notifications merged into this cluster. */
  notificationIds: string[];
  /** Cluster priority 0..100. */
  priority: number;
  /** Cluster kind (matches underlying notification types). */
  kind: string;
  /** Whether the cluster should be delivered now or delayed. */
  delivery: "now" | "delayed" | "merged";
  /** Earliest delivery time (ISO). */
  deliverAt: string;
  /** Total notifications in the cluster. */
  count: number;
}

export interface NotificationIntelligenceReport {
  /** Clustered notifications. */
  clusters: NotificationCluster[];
  /** Notifications that were deduplicated (and dropped). */
  deduplicatedCount: number;
  /** Notifications that were delayed for batching. */
  delayedCount: number;
  /** Total notifications considered. */
  totalConsidered: number;
  /** Generated at. */
  generatedAt: string;
}

// ===========================================================================
// SYSTEM 9 — Cross-Module Navigation
// ===========================================================================

export interface NavigationGraph {
  /** Root entity the navigation is anchored to. */
  root: { type: string; id: string; title: string };
  /** Related entities grouped by relationship. */
  relations: NavigationRelation[];
  /** Total related entities. */
  totalRelations: number;
}

export interface NavigationRelation {
  /** Relationship type. */
  type: string;
  /** Direction (forward / backward). */
  direction: "forward" | "backward";
  /** Display label. */
  label: string;
  /** Related entities. */
  entities: Array<{ type: string; id: string; title: string; url?: string }>;
  /** Module that owns the relation. */
  module: string;
}

// ===========================================================================
// SYSTEM 10 — Intent Engine
// ===========================================================================

export interface UserIntent {
  /** Detected intent label, e.g. "create_lesson". */
  intent: string;
  /** Confidence 0..1. */
  confidence: number;
  /** Required subsystems to fulfill the intent. */
  requiredSystems: string[];
  /** Required agents (Education OS). */
  requiredAgents: AssistantAgentKind[];
  /** Required workflows (Platform Orchestrator). */
  requiredWorkflows: string[];
  /** Recommended actions. */
  recommendedActions: Array<{ action: string; rationale: string; priority: number }>;
  /** Original query. */
  query: string;
  /** Whether the intent was confidently detected. */
  detected: boolean;
}

// ===========================================================================
// SYSTEM 11 — Product Memory
// ===========================================================================

export interface ProductMemoryEntry {
  id: string;
  userId: string;
  /** Memory key (e.g. "favorite_views.dashboard"). */
  key: string;
  /** Memory value (JSON-serialized). */
  value: unknown;
  /** Memory category. */
  category: "preference" | "layout" | "history" | "behavior" | "ai_style";
  /** When the memory was recorded. */
  createdAt: string;
  /** When the memory was last accessed. */
  lastAccessedAt: string;
}

export interface ProductMemoryReport {
  favoriteViews: string[];
  hiddenWidgets: string[];
  dashboardLayout: Record<string, unknown>;
  preferredAIStyle: string;
  lastVisitedPages: string[];
  /** Total memory entries. */
  totalEntries: number;
}

// ===========================================================================
// SYSTEM 12 — Product Analytics
// ===========================================================================

export interface ProductAnalyticsReport {
  /** Feature adoption — what % of users use each feature. */
  featureAdoption: Array<{ feature: string; users: number; percent: number }>;
  /** Drop-off points in journeys. */
  dropOffs: Array<{ journey: string; step: string; dropOffRate: number }>;
  /** Workflow completion rates. */
  workflowCompletion: Array<{ workflow: string; started: number; completed: number; completionRate: number }>;
  /** Estimated time saved by AI assistance. */
  timeSavedMinutes: number;
  /** AI assistance acceptance rate (0..1). */
  aiAssistanceAcceptance: number;
  /** Dashboard usage stats. */
  dashboardUsage: Array<{ widget: string; views: number; avgTimeSeconds: number }>;
  /** Top navigation paths. */
  navigationPaths: Array<{ from: string; to: string; count: number }>;
  /** Friction points detected. */
  frictionPoints: Array<{ location: string; severity: number; description: string }>;
  /** Optimization recommendations. */
  recommendations: Array<{ recommendation: string; impact: number; effort: number }>;
  /** Generated at. */
  generatedAt: string;
}
