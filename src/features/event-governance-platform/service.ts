/** Enterprise Event Governance Platform service — composes all 12 systems. */

// System 1 — Event Policy Engine
export {
  createPolicy, getPolicyById, getPolicies, updatePolicy, removePolicy,
  evaluatePolicy, checkSLACompliance, calculateRetryDelay, shouldDeadLetter,
  recordPolicyViolation, getViolations, validatePolicy, getPolicyStats,
  DEFAULT_POLICY_TEMPLATE,
} from "./event-policy-engine";

// System 2 — Event Delivery Rules
export {
  createDeliveryRule, getDeliveryRuleById, getRuleForEvent, getAllRules,
  recordDeliveryResult, getResultsForEvent, validateDeliveryRule,
  getDeliveryStats, requiresAcknowledgment, requiresDeduplication, supportsOrdering,
  DEFAULT_DELIVERY_RULE_TEMPLATE,
} from "./delivery-engine";

// Systems 3 + 4 — Classification + Catalog
export {
  classifyEvent, getClassificationForEvent, getAllClassifiedEvents,
  getEventsByClass, getEventsBySeverity, getSLAForEvent,
  generateCatalog, getCatalogEntry, getCatalogStats,
  DEFAULT_CLASSIFICATION_BY_CATEGORY,
} from "./classification-catalog";

// System 5 — Correlation Graph
export {
  registerCorrelationNode, getCorrelationNodeById,
  buildCorrelationGraph, buildTraceGraph, buildTimeline,
  getChildren, getParent, getEventChain, getAllEdges, getAllNodes,
  getCorrelationStats,
} from "./correlation-graph";

// Systems 6 + 7 — Producer + Consumer Health
export {
  recordProducerMetrics, getProducerHealthRecord, getAllProducerHealthRecords,
  getUnhealthyProducers, getDegradedProducers,
  recordConsumerMetrics, getConsumerHealthRecord, getAllConsumerHealthRecords,
  getUnhealthyConsumers, getDegradedConsumers, getSlowConsumers,
  getOverallHealthStats,
} from "./producer-consumer-monitor";

// Systems 8, 9, 10, 11 — Metrics + Dashboards
export {
  recordEventMetrics, getMetricsForEvent, getAllMetrics, getMetricsStats,
  generateLifecycleDashboard,
  generateObservabilityDashboard,
  generateGovernanceDashboard,
  generatePlatformHealth,
} from "./metrics-dashboard";

// System 12 — Documentation Generator
export {
  generateGovernanceDocumentation, generateMarkdownDocumentation, generateJsonDocumentation,
} from "./documentation-generator";

// Repository (for testing)
export { _resetRepositoryForTesting } from "./repository";
