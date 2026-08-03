/**
 * EduBek — Enterprise Event Governance, Policy, Delivery & Observability Platform types.
 * Phase 6G.8A: Production-grade governance layer sitting alongside the Event Bus.
 *
 * Architecture:
 *
 *   Game Engine
 *       │
 *       ▼
 *   Event Bus
 *       │
 *   Enterprise Event Governance
 *   ├── Event Registry (existing, reused)
 *   ├── Event Policy Engine
 *   ├── Event Delivery Rules
 *   ├── Event Catalog
 *   ├── Event Classification
 *   ├── Correlation Graph
 *   ├── Consumer Monitoring
 *   ├── Producer Monitoring
 *   ├── Event Metrics
 *   ├── Event Lifecycle Dashboard
 *       │
 *       ▼
 *   Consumers
 *
 *   This module NEVER owns gameplay.
 *   This module NEVER owns business logic.
 *   This module NEVER owns engine state.
 *   It simply ensures that every event flowing through EduBek is reliable,
 *   observable, versioned, documented and production-ready.
 *
 * Strict rules:
 *   - Universal Game Engine untouched
 *   - Event Bus implementation untouched
 *   - Game Modes untouched
 *   - Replay, Analytics, Progression, Competitive untouched
 *   - Existing Event Registry interfaces untouched (reused only)
 *   - No event payload mutation
 *   - No gameplay behavior changes
 */

// Reuse existing types from the Event Registry
import type {
  EventCategory,
  EventStatus,
  EventProducer,
  EventContract,
  EventMetadata,
} from "@/features/game-engine/events";

// Re-export EventMetadata so other files in this module can import it from ./types
export type { EventMetadata } from "@/features/game-engine/events";

// ===========================================================================
// System 1 — Event Policy Engine
// ===========================================================================

export type DeliveryMode =
  | "sync"           // Synchronous delivery
  | "async"          // Asynchronous delivery
  | "ordered"        // Ordered delivery (per consumer)
  | "unordered";     // Order-independent

export type Priority = "critical" | "high" | "normal" | "low" | "background";

export type RetryStrategy =
  | "none"           // No retries
  | "fixed"          // Fixed delay between retries
  | "exponential"    // Exponential backoff
  | "linear";        // Linear backoff

export type DeadLetterEligibility =
  | "eligible"       // Can be sent to dead-letter queue
  | "ineligible"     // Never dead-lettered (always retried)
  | "drop";          // Drop on failure (no dead-letter)

export type RetentionPolicy =
  | "permanent"      // Never expire
  | "days_7"         // 7 days
  | "days_30"        // 30 days
  | "days_90"        // 90 days
  | "days_365"       // 1 year
  | "transient";     // Not persisted

export type SLAProfile =
  | "realtime"       // < 100ms
  | "interactive"    // < 1s
  | "near_realtime"  // < 5s
  | "batch"          // < 60s
  | "best_effort";   // No SLA

export interface EventPolicy {
  /** Unique policy ID. */
  policyId: string;
  /** Display name. */
  displayName: string;
  /** Description. */
  description: string;
  /** Event ID this policy applies to (or "*" for all events). */
  eventId: string;
  /** Delivery mode. */
  deliveryMode: DeliveryMode;
  /** Priority level. */
  priority: Priority;
  /** Whether delivery is persistent (survives restart). */
  persistent: boolean;
  /** Whether this event is ephemeral (not persisted). */
  ephemeral: boolean;
  /** Whether this event is eligible for replay. */
  replayEligible: boolean;
  /** Whether this event requires audit trail. */
  auditRequired: boolean;
  /** Retry strategy. */
  retryStrategy: RetryStrategy;
  /** Maximum retry attempts. */
  maxRetries: number;
  /** Initial retry delay in ms. */
  retryInitialDelayMs: number;
  /** Maximum retry delay in ms (for exponential backoff). */
  retryMaxDelayMs: number;
  /** Dead-letter eligibility. */
  deadLetterEligibility: DeadLetterEligibility;
  /** Delivery timeout in ms. */
  timeoutMs: number;
  /** Whether consumers are isolated (failures don't affect others). */
  consumerIsolation: boolean;
  /** Whether batching is enabled. */
  batchingEnabled: boolean;
  /** Batch size (if batching enabled). */
  batchSize: number;
  /** Batch flush interval in ms. */
  batchFlushMs: number;
  /** Retention profile. */
  retention: RetentionPolicy;
  /** SLA profile. */
  sla: SLAProfile;
  /** Whether this policy is active. */
  active: boolean;
  /** When this policy was created. */
  createdAt: string;
  /** When this policy was last updated. */
  updatedAt: string;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  eventId: string;
  violationType: string;
  description: string;
  severity: "error" | "warning" | "info";
  detectedAt: string;
}

// ===========================================================================
// System 2 — Event Delivery Rules
// ===========================================================================

export type QueueStrategy =
  | "fifo"           // First-in-first-out
  | "lifo"           // Last-in-first-out
  | "priority"       // Priority-based
  | "round_robin";   // Round-robin across consumers

export type BufferStrategy =
  | "bounded"        // Fixed-size buffer
  | "unbounded"      // Unlimited buffer
  | "sliding"        // Sliding window
  | "drop_oldest";   // Drop oldest when full

export type QoSLevel =
  | "at_most_once"   // May lose events
  | "at_least_once"  // May duplicate events
  | "exactly_once";  // No loss, no duplication

export type DeduplicationStrategy =
  | "event_id"       // Dedupe by event ID
  | "idempotency_key" // Dedupe by idempotency key
  | "content_hash"   // Dedupe by content hash
  | "none";          // No deduplication

export interface DeliveryRule {
  /** Unique rule ID. */
  ruleId: string;
  /** Event ID this rule applies to. */
  eventId: string;
  /** Delivery guarantee. */
  deliveryGuarantee: QoSLevel;
  /** Ordering requirement. */
  ordering: "strict" | "causal" | "none";
  /** Consumer concurrency limit. */
  consumerConcurrency: number;
  /** Queue strategy. */
  queueStrategy: QueueStrategy;
  /** Buffer strategy. */
  bufferStrategy: BufferStrategy;
  /** Buffer size (if bounded). */
  bufferSize: number;
  /** Retry strategy. */
  retryStrategy: RetryStrategy;
  /** Deduplication strategy. */
  deduplication: DeduplicationStrategy;
  /** Delivery timeout in ms. */
  deliveryTimeoutMs: number;
  /** Maximum delivery attempts. */
  maxDeliveryAttempts: number;
  /** Whether the rule is active. */
  active: boolean;
}

export interface DeliveryResult {
  eventId: string;
  consumerId: string;
  success: boolean;
  attempts: number;
  latencyMs: number;
  deliveredAt: string;
  error: string | null;
}

// ===========================================================================
// System 3 — Event Classification
// ===========================================================================

export type EventClass =
  | "mission_critical"    // System cannot function without these events
  | "business_critical"   // Core business operations
  | "operational"         // Day-to-day operations
  | "analytics"           // Analytics and reporting
  | "informational";      // Informational only

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ClassificationProfile {
  eventClass: EventClass;
  severity: Severity;
  priority: Priority;
  retention: RetentionPolicy;
  monitoringProfile: MonitoringProfile;
  alertProfile: AlertProfile;
  slaProfile: SLAProfile;
}

export type MonitoringProfile =
  | "full"           // All metrics tracked
  | "standard"       // Standard metrics
  | "minimal"        // Minimal tracking
  | "none";          // No monitoring

export type AlertProfile =
  | "immediate"      // Alert immediately on issues
  | "aggregated"     // Aggregate alerts
  | "threshold"      // Alert on threshold breach
  | "silent";        // No alerts

export interface EventClassification {
  eventId: string;
  classification: ClassificationProfile;
  classifiedAt: string;
  classifiedBy: string;
}

// ===========================================================================
// System 4 — Event Catalog (derived from Registry)
// ===========================================================================

export interface CatalogEntry {
  eventId: string;
  displayName: string;
  description: string;
  purpose: string;
  producer: EventProducer;
  consumers: EventProducer[];
  category: EventCategory;
  classification: EventClass | null;
  payloadType: string;
  schema: EventContract["schema"];
  examples: Record<string, unknown>[];
  version: string;
  status: EventStatus;
  versionHistory: VersionHistoryEntry[];
  deprecated: boolean;
  replacementEventId: string | null;
  deprecationMessage: string | null;
  latency: LatencyProfile | null;
  throughput: ThroughputProfile | null;
  documentation: string;
  policy: EventPolicy | null;
  deliveryRule: DeliveryRule | null;
}

export interface VersionHistoryEntry {
  version: string;
  status: EventStatus;
  releaseDate: string;
  changes: string;
}

export interface LatencyProfile {
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

export interface ThroughputProfile {
  eventsPerSecond: number;
  eventsPerMinute: number;
  eventsPerHour: number;
  peakEventsPerSecond: number;
}

export interface EventCatalog {
  totalEvents: number;
  entries: CatalogEntry[];
  generatedAt: string;
}

// ===========================================================================
// System 5 — Event Correlation Graph
// ===========================================================================

export interface CorrelationNode {
  eventId: string;
  eventType: string;
  traceId: string | null;
  correlationId: string | null;
  causationId: string | null;
  parentEventId: string | null;
  childEventIds: string[];
  timestamp: string;
  producer: EventProducer;
  metadata: EventMetadata;
}

export interface CorrelationEdge {
  fromEventId: string;
  toEventId: string;
  relationship: "caused_by" | "correlated_with" | "child_of" | "triggered";
  strength: number;
}

export interface CorrelationGraph {
  rootEventId: string | null;
  nodes: CorrelationNode[];
  edges: CorrelationEdge[];
  depth: number;
  totalEvents: number;
  fanOut: number;
  fanIn: number;
}

export interface CorrelationTimeline {
  events: Array<{
    eventId: string;
    eventType: string;
    timestamp: string;
    depth: number;
    producer: EventProducer;
  }>;
  duration: number;
  rootEventId: string | null;
}

// ===========================================================================
// System 6 — Producer Health
// ===========================================================================

export interface ProducerHealth {
  producer: EventProducer;
  throughput: number;          // events per second
  totalEvents: number;
  errorCount: number;
  errorRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  ownedEvents: string[];
  contractViolations: number;
  versionUsage: Record<string, number>;
  deprecatedUsage: number;
  healthScore: number;         // 0-100
  status: "healthy" | "degraded" | "unhealthy";
  lastEventAt: string | null;
  updatedAt: string;
}

// ===========================================================================
// System 7 — Consumer Health
// ===========================================================================

export interface ConsumerHealth {
  consumer: EventProducer;
  processingLatencyMs: number;
  p95ProcessingMs: number;
  queueLag: number;
  retryCount: number;
  deadLetterCount: number;
  successRate: number;
  avgProcessingMs: number;
  totalProcessed: number;
  totalFailed: number;
  lastProcessingAt: string | null;
  healthScore: number;         // 0-100
  status: "healthy" | "degraded" | "unhealthy";
  subscribedEvents: string[];
  updatedAt: string;
}

// ===========================================================================
// System 8 — Event Metrics
// ===========================================================================

export interface EventMetrics {
  eventId: string;
  publishCount: number;
  consumeCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgProcessingTimeMs: number;
  queueDepth: number;
  retryRate: number;
  failureRate: number;
  consumerCount: number;
  versionAdoption: Record<string, number>;
  classification: EventClass | null;
  lastPublishedAt: string | null;
  lastConsumedAt: string | null;
}

// ===========================================================================
// System 9 — Event Lifecycle Dashboard
// ===========================================================================

export interface LifecycleDashboard {
  totalEvents: number;
  currentVersions: Array<{ eventId: string; version: string; status: EventStatus }>;
  deprecatedEvents: Array<{ eventId: string; version: string; replacementEventId: string | null }>;
  experimentalEvents: Array<{ eventId: string; version: string }>;
  removedEvents: Array<{ eventId: string; version: string }>;
  migrationPaths: Array<{ fromEventId: string; toEventId: string; description: string }>;
  versionAdoption: Record<string, number>;
  compatibilityIssues: Array<{ eventId: string; issue: string }>;
  ownershipValidation: Array<{ eventId: string; valid: boolean; issue: string | null }>;
}

// ===========================================================================
// System 10 — Observability Dashboard
// ===========================================================================

export interface ObservabilityDashboard {
  topProducers: Array<{ producer: EventProducer; throughput: number; healthScore: number }>;
  topConsumers: Array<{ consumer: EventProducer; processed: number; healthScore: number }>;
  slowConsumers: Array<{ consumer: EventProducer; avgProcessingMs: number }>;
  slowEvents: Array<{ eventId: string; avgLatencyMs: number }>;
  queueHealth: Array<{ eventId: string; depth: number; lag: number }>;
  retryTrends: Array<{ timestamp: string; retries: number }>;
  deadLetters: Array<{ eventId: string; consumer: EventProducer; count: number }>;
  throughput: { eventsPerSecond: number; eventsPerMinute: number };
  errorRate: number;
  avgProcessingLatency: number;
  slaCompliance: number;       // percentage
  updatedAt: string;
}

// ===========================================================================
// System 11 — Governance Dashboard
// ===========================================================================

export interface GovernanceDashboard {
  ownership: Array<{ eventId: string; producer: EventProducer; valid: boolean }>;
  validationIssues: Array<{ eventId: string; issue: string; severity: string }>;
  policyViolations: PolicyViolation[];
  schemaViolations: Array<{ eventId: string; field: string; issue: string }>;
  producerViolations: Array<{ producer: EventProducer; eventId: string; issue: string }>;
  unauthorizedPublishers: Array<{ producer: EventProducer; eventId: string; timestamp: string }>;
  deprecatedContracts: Array<{ eventId: string; version: string; replacement: string | null }>;
  unusedContracts: Array<{ eventId: string; lastUsed: string | null }>;
  unusedConsumers: Array<{ consumer: EventProducer; lastActive: string | null }>;
  duplicateDefinitions: Array<{ eventId: string; producers: EventProducer[] }>;
}

// ===========================================================================
// System 12 — Documentation Generator
// ===========================================================================

export interface GovernanceDocumentation {
  generatedAt: string;
  totalEvents: number;
  architecture: string;
  policyEngine: string;
  deliveryRules: string;
  classification: string;
  catalog: string;
  correlation: string;
  metrics: string;
  dashboards: string;
  ownershipTables: OwnershipTable[];
  versionTables: VersionTable[];
  classificationTables: ClassificationTable[];
  policyTables: PolicyTable[];
}

export interface OwnershipTable {
  eventId: string;
  producer: EventProducer;
  consumers: EventProducer[];
  valid: boolean;
}

export interface VersionTable {
  eventId: string;
  version: string;
  status: EventStatus;
  deprecated: boolean;
  replacement: string | null;
}

export interface ClassificationTable {
  eventId: string;
  eventClass: EventClass | null;
  severity: Severity | null;
  sla: SLAProfile | null;
}

export interface PolicyTable {
  eventId: string;
  policyId: string;
  deliveryMode: DeliveryMode;
  priority: Priority;
  sla: SLAProfile;
  active: boolean;
}

// ===========================================================================
// System — Health (general platform health)
// ===========================================================================

export interface PlatformHealth {
  status: "healthy" | "degraded" | "unhealthy";
  totalProducers: number;
  totalConsumers: number;
  totalEvents: number;
  totalPolicies: number;
  activeAlerts: number;
  deadLetterQueueSize: number;
  avgHealthScore: number;
  components: Array<{
    name: string;
    status: "healthy" | "degraded" | "unhealthy";
    details: string;
  }>;
  updatedAt: string;
}
