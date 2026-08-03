/**
 * EduBek — Cognitive AI barrel export.
 *
 * Phase 5D.6: Cognitive AI Layer, Long-Horizon Reasoning & Autonomous
 * Educational Decision Engine.
 *
 * 18 systems:
 *   1. Multi-Level Memory (working + episodic + semantic)
 *   2. Long-Horizon Planning
 *   3. Goal Engine
 *   4. Cognitive Reasoning Engine
 *   5. Knowledge Retrieval
 *   6. Tool Selection
 *   7. Decision Engine
 *   8. Uncertainty Engine
 *   9. Verification Engine
 *  10. Reflection Engine
 *  11. Continuous Learning Loop
 *  12. Explainability Engine
 *  13. Conversation State
 *  14. Educational Thinking Frameworks
 *  15. Meta-Cognition
 *  16. Autonomous Delegation
 *  17. Cognitive Analytics
 *  18. Production Integration
 *
 * No new domain capabilities — every system reuses services from
 * earlier phases (Platform Orchestrator, Education OS, Digital Twins,
 * Knowledge Graph, Learning Planner, Discovery, Assessment Platform,
 * Platform Intelligence, Civilization Engine, Global Intelligence,
 * Cloud Infrastructure, Data Fabric, Research Platform, Product
 * Intelligence).
 */

// Service (single import surface for routes)
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
} from "./service";

// Types
export type {
  MemoryLevel,
  WorkingMemoryEntry, EpisodicMemoryEntry, SemanticMemoryEntry, MemoryRetrievalResult,
  PlanningGraph, PlanNode,
  GoalKind, CognitiveGoal,
  ReasoningStage, ReasoningStageResult, CognitiveReasoningResult,
  EvidenceItem, EvidenceGraph,
  ToolDefinition, ToolSelectionResult,
  DecisionOption, DecisionResult,
  UncertaintyKind, UncertaintyEstimate,
  VerificationResult, VerificationCheck,
  ReflectionEntry,
  LearningLoopUpdate,
  Explanation,
  ConversationState,
  ThinkingFrameworkKind, ThinkingFramework,
  MetaCognitionAssessment, MetaCognitionIssueKind,
  DelegationRequest,
  CognitiveAnalyticsReport,
  CognitiveContextSnapshot,
} from "./types";

export type { ReasonInput } from "./reasoning-engine";
