/**
 * EduBek — Product Intelligence main service.
 *
 * Phase 5D.5: Composes every product-intelligence subsystem into a
 * unified API surface. Routes are thin wrappers around the functions
 * exported here.
 */
import { buildUnifiedContext, type BuildUnifiedContextInput } from "./context-engine";
import {
  listJourneyTemplates, getJourneyTemplate, startJourney, getJourney,
  getActiveJourney, listUserJourneys, advanceJourney, blockStep,
  addSuggestion, computeJourneySuggestions,
} from "./journey-engine";
import {
  createWorkspace, getWorkspace, getActiveWorkspace, listWorkspaces,
  saveDraft, setTabs, addTab, closeTab, recordHistory, pushUndo, popUndo,
  resumeWorkspace, closeWorkspace, deleteWorkspace, autosave,
} from "./workspace-manager";
import {
  generateAttentionReport, listOpenAttentionItems,
  acknowledgeAttentionItem, resolveAttentionItem,
} from "./attention-engine";
import { routeAssistant, chatWithAssistant, listAgents } from "./assistant-orchestrator";
import { generateActions } from "./smart-actions";
import { computeAdaptiveInterface } from "./adaptive-ui";
import { buildNavigationGraph } from "./cross-module-navigation";
import { detectIntent, listIntents, getRecentIntents } from "./intent-engine";
import {
  setMemory, getMemory, deleteMemory, listMemory, getMemoryReport,
  addFavoriteView, removeFavoriteView, hideWidget, showWidget,
  setDashboardLayout, setPreferredAIStyle, recordVisitedPage,
} from "./product-memory";
import { generateNotificationReport, listPendingClusters, markClusterDelivered } from "./notification-intelligence";
import { trackEvent, generateAnalyticsReport } from "./analytics";

// ===========================================================================
// Re-exports
// ===========================================================================

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
};

export type { BuildUnifiedContextInput };
