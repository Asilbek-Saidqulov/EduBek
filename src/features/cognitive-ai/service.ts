/**
 * EduBek — Cognitive AI main service.
 *
 * Phase 5D.6: Composes every cognitive subsystem into a unified API
 * surface. Routes are thin wrappers around the functions exported here.
 */
import { reason, getCognitiveAnalytics, THINKING_FRAMEWORKS, type ReasonInput } from "./reasoning-engine";
import {
  setWorkingMemory, getWorkingMemory, getWorkingMemoryByKind,
  deleteWorkingMemoryEntry, evictExpired, setCurrentTask, getCurrentTask,
} from "./working-memory";
import {
  recordEpisode, listEpisodes, searchEpisodes, findSimilarEpisodes,
  recordTeacherAction, recordStudentMilestone, recordOrganizationDecision, recordAIIntervention,
} from "./episodic-memory";
import {
  recordKnowledge, listKnowledge, searchKnowledge, seedBuiltinKnowledge, BUILTIN_KNOWLEDGE,
} from "./semantic-memory";
import {
  createGoal, listGoals, getGoal, updateGoalProgress, updateGoalTarget,
  rankGoalsForContext, getGoalTemplate, listGoalTemplates, GOAL_TEMPLATES, GOAL_CONFLICTS,
} from "./goal-engine";
import {
  createPlan, getPlan, listPlans, generatePlanFromTemplate, listPlanTemplates,
  pickPlanTemplate, topologicalSort,
} from "./planning-engine";
import { retrieveEvidence, rankEvidence } from "./knowledge-retrieval";
import { listTools, getTool, selectTools, TOOL_CATALOG } from "./tool-selection";
import { estimateUncertainty, explainUncertainty, UNCERTAINTY_KINDS } from "./uncertainty-engine";
import { verifyAnswer } from "./verification-engine";
import {
  reflectOnAction, listReflections, assessMetaCognition,
} from "./reflection-engine";
import {
  evaluateDecision, listDecisionTemplates, getDecisionTemplate, listDecisions,
} from "./decision-engine";
import { buildExplanation, summarizeExplanation } from "./explanation-engine";
import {
  startConversation, getConversation, getActiveConversation, updateConversation,
  endConversation, addEntity, addAssumption, addPendingQuestion,
  resolvePendingQuestion, addFollowUp,
} from "./conversation-state";
import {
  runLearningCycle, getParameters, setParameter,
  cacheReasoning, getCachedReasoning, clearReasoningCache, getCacheSize,
} from "./learning-loop";

// ===========================================================================
// Re-exports
// ===========================================================================

export {
  reason, getCognitiveAnalytics, THINKING_FRAMEWORKS,
  setWorkingMemory, getWorkingMemory, getWorkingMemoryByKind,
  deleteWorkingMemoryEntry, evictExpired, setCurrentTask, getCurrentTask,
  recordEpisode, listEpisodes, searchEpisodes, findSimilarEpisodes,
  recordTeacherAction, recordStudentMilestone, recordOrganizationDecision, recordAIIntervention,
  recordKnowledge, listKnowledge, searchKnowledge, seedBuiltinKnowledge, BUILTIN_KNOWLEDGE,
  createGoal, listGoals, getGoal, updateGoalProgress, updateGoalTarget,
  rankGoalsForContext, getGoalTemplate, listGoalTemplates, GOAL_TEMPLATES, GOAL_CONFLICTS,
  createPlan, getPlan, listPlans, generatePlanFromTemplate, listPlanTemplates,
  pickPlanTemplate, topologicalSort,
  retrieveEvidence, rankEvidence,
  listTools, getTool, selectTools, TOOL_CATALOG,
  estimateUncertainty, explainUncertainty, UNCERTAINTY_KINDS,
  verifyAnswer,
  reflectOnAction, listReflections, assessMetaCognition,
  evaluateDecision, listDecisionTemplates, getDecisionTemplate, listDecisions,
  buildExplanation, summarizeExplanation,
  startConversation, getConversation, getActiveConversation, updateConversation,
  endConversation, addEntity, addAssumption, addPendingQuestion,
  resolvePendingQuestion, addFollowUp,
  runLearningCycle, getParameters, setParameter,
  cacheReasoning, getCachedReasoning, clearReasoningCache, getCacheSize,
};

export type { ReasonInput };
