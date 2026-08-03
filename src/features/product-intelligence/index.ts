/**
 * EduBek — Product Intelligence barrel export.
 *
 * Phase 5D.5: Experience orchestration layer that turns EduBek from a
 * collection of powerful systems into one coherent product.
 *
 * 12 systems:
 *   1. Unified User Context Engine (context-engine)
 *   2. Journey Engine (journey-engine)
 *   3. Workspace Manager (workspace-manager)
 *   4. Attention Engine (attention-engine)
 *   5. Assistant Orchestrator (assistant-orchestrator)
 *   6. Smart Actions (smart-actions)
 *   7. Adaptive Interface (adaptive-ui)
 *   8. Notification Intelligence (notification-intelligence)
 *   9. Cross-Module Navigation (cross-module-navigation)
 *  10. Intent Engine (intent-engine)
 *  11. Product Memory (product-memory)
 *  12. Product Analytics (analytics)
 *
 * No new domain capabilities — every system reuses services from
 * earlier phases (Platform Orchestrator, Education OS, Digital Twins,
 * Knowledge Graph, Learning Planner, Discovery, Assessment Platform,
 * Platform Intelligence, Civilization Engine, Global Intelligence,
 * Cloud Infrastructure, Data Fabric).
 */

// Service (single import surface for routes)
export {
  buildUnifiedContext,
  listJourneyTemplates, getJourneyTemplate, startJourney, getJourney,
  getActiveJourney, listUserJourneys, advanceJourney, blockStep,
  addSuggestion, computeJourneySuggestions,
  createWorkspace, getWorkspace, getActiveWorkspace, listWorkspaces,
  saveDraft, setTabs, addTab, closeTab, recordHistory, pushUndo, popUndo,
  resumeWorkspace, closeWorkspace, deleteWorkspace, autosave,
  generateAttentionReport, listOpenAttentionItems,
  acknowledgeAttentionItem, resolveAttentionItem,
  routeAssistant, chatWithAssistant, listAgents,
  generateActions,
  computeAdaptiveInterface,
  buildNavigationGraph,
  detectIntent, listIntents, getRecentIntents,
  setMemory, getMemory, deleteMemory, listMemory, getMemoryReport,
  addFavoriteView, removeFavoriteView, hideWidget, showWidget,
  setDashboardLayout, setPreferredAIStyle, recordVisitedPage,
  generateNotificationReport, listPendingClusters, markClusterDelivered,
  trackEvent, generateAnalyticsReport,
} from "./service";

// Types
export type {
  UnifiedProductContext, OrganizationContext, ClassroomContext,
  PermissionSummary, CurriculumContext, LearningGoalContext,
  ActiveAssignmentContext, RecommendationContext, AIHistoryContext,
  DigitalTwinSummary, PlannerSummary, CurrentWorkflowContext,
  DraftSummary, NotificationContext, ProductMemorySnapshot,
  JourneyKind, JourneyState, JourneyStep,
  WorkspaceState, WorkspaceTab, WorkspaceHistoryEntry, WorkspaceUndoEntry,
  AttentionKind, AttentionItem, AttentionReport,
  AssistantAgentKind, AssistantRouting, AssistantResponse,
  SmartAction, SmartActionSet,
  AdaptiveInterface, AdaptiveWidget, AdaptiveCard, AdaptiveQuickAction,
  NotificationCluster, NotificationIntelligenceReport,
  NavigationGraph, NavigationRelation,
  UserIntent,
  ProductMemoryEntry, ProductMemoryReport,
  ProductAnalyticsReport,
} from "./types";

// Subsystem exports (advanced use)
export { JOURNEY_TEMPLATES } from "./journey-engine";
export { AGENT_METADATA } from "./assistant-orchestrator";
export { MEMORY_KEYS } from "./product-memory";
