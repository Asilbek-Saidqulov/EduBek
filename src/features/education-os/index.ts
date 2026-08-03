/**
 * EduBek — Education OS barrel export.
 *
 * Phase 4F.6: Autonomous Education OS — Multi-Agent AI framework,
 * Agent Coordinator, Shared Agent Memory, Workflow Engine,
 * Automation Engine, Event Bus extensions, Institutional Intelligence,
 * Simulation Engine, AI Reasoning metadata, Executive Analytics.
 *
 * Everything is additive — no breaking changes to prior phases.
 */
// Main service
export {
  getStatus,
  execute,
  runWorkflow,
  getWorkflowExecution,
  listWorkflowExecutions,
  listAllWorkflowTypes,
  getWorkflowTypeDef,
  listAgents,
  getAgent,
  chatWithAgent,
  storeAgentMemory,
  recallAgentMemory,
  getAgentMemory,
  deleteAgentMemory,
  pruneMemory,
  listAutomationRules,
  getAutomationRule,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  seedBuiltinAutomationPolicies,
  runSimulation,
  getSimulationResult,
  listSimulationResults,
  getRecommendations,
  getAnalyticsSummary,
} from "./service";

// Coordinator (advanced use — direct coordinator access)
export {
  execute as coordinatorExecute,
  listRegisteredAgents,
  getAgentDefinition,
} from "./coordinator";

// Workflow engine (advanced use)
export {
  executeWorkflow,
  listWorkflowTypes,
  getWorkflowDefinition,
} from "./workflow";

// Automation engine (advanced use)
export {
  ensureAutomationRegistered,
  seedBuiltinPolicies,
} from "./automation";

// Policies
export {
  POLICY_TEMPLATES,
  getPolicyTemplate,
  evaluateConditions,
} from "./policies";

// Events
export {
  RESOURCE_CREATED_EVENT,
  QUIZ_COMPLETED_EVENT,
  LESSON_GENERATED_EVENT,
  TRANSLATION_CREATED_EVENT,
  MARKETPLACE_PURCHASE_EVENT,
  STUDY_SESSION_COMPLETED_EVENT,
  KNOWLEDGE_HEALTH_UPDATED_EVENT,
  ORGANIZATION_SNAPSHOT_CREATED_EVENT,
  EDUCATION_OS_EVENT_TYPES,
  isEducationOsEventType,
  type ResourceCreatedEvent,
  type QuizCompletedEvent,
  type LessonGeneratedEvent,
  type TranslationCreatedEvent,
  type MarketplacePurchaseEvent,
  type StudySessionCompletedEvent,
  type KnowledgeHealthUpdatedEvent,
  type OrganizationSnapshotCreatedEvent,
  type EducationOsEvent,
} from "./events";

// Types
export type {
  AgentType,
  AgentCapability,
  AgentDefinition,
  AgentTask,
  AgentReasoning,
  AgentResponse,
  CoordinatorExecution,
  MemoryScopeType,
  MemoryType,
  AgentMemoryDto,
  CreateMemoryInput,
  WorkflowType,
  WorkflowStep,
  WorkflowDefinition,
  WorkflowExecution,
  AutomationTrigger,
  AutomationAction,
  AutomationRuleDto,
  CreateAutomationInput,
  SimulationInput,
  SimulationPredictions,
  SimulationAffected,
  SimulationCosts,
  SimulationResultDto,
  DashboardLevel,
  InstitutionalDashboard,
  AgentExecutionLogDto,
  EducationOsEventType,
  EducationOsStatus,
  EducationOsRecommendation,
} from "./types";
