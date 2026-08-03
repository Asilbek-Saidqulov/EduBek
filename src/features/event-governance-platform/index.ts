/** Enterprise Event Governance Platform barrel export. Phase 6G.8A. */
export * from "./service";

export type {
  // System 1 — Policy Engine
  DeliveryMode, Priority, RetryStrategy, DeadLetterEligibility,
  RetentionPolicy, SLAProfile, EventPolicy, PolicyViolation,
  // System 2 — Delivery Rules
  QueueStrategy, BufferStrategy, QoSLevel, DeduplicationStrategy,
  DeliveryRule, DeliveryResult,
  // System 3 — Classification
  EventClass, Severity, ClassificationProfile, MonitoringProfile, AlertProfile,
  EventClassification,
  // System 4 — Catalog
  CatalogEntry, VersionHistoryEntry, LatencyProfile, ThroughputProfile, EventCatalog,
  // System 5 — Correlation
  CorrelationNode, CorrelationEdge, CorrelationGraph, CorrelationTimeline,
  // Systems 6, 7 — Health
  ProducerHealth, ConsumerHealth,
  // System 8 — Metrics
  EventMetrics,
  // System 9 — Lifecycle Dashboard
  LifecycleDashboard,
  // System 10 — Observability Dashboard
  ObservabilityDashboard,
  // System 11 — Governance Dashboard
  GovernanceDashboard,
  // System 12 — Documentation
  GovernanceDocumentation, OwnershipTable, VersionTable, ClassificationTable, PolicyTable,
  // Platform Health
  PlatformHealth,
} from "./types";
