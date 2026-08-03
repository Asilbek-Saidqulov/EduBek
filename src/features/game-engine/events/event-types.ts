/**
 * EduBek — Event Registry types.
 *
 * This module defines the canonical types for the Event Governance layer.
 * It is the SINGLE SOURCE OF TRUTH for event definitions across the
 * entire Gaming Platform.
 *
 * The registry owns event definitions ONLY — never business logic.
 * Every business module owns its own behavior.
 *
 * Architecture:
 *
 *                    Universal Game Engine
 *                             │
 *                      Engine Event Bus
 *                             │
 *       ┌──────────────┬──────────────┬──────────────┬──────────────┐
 *       │              │              │              │
 *       ▼              ▼              ▼              ▼
 *  Player          Competitive    Analytics     Hall of Fame
 *  Progression     Platform
 *
 *   The Event Registry sits ALONGSIDE the Event Bus — it does not replace
 *   it. The registry provides discoverability, validation, contracts,
 *   ownership, versioning, and documentation while remaining completely
 *   deterministic.
 */

// ===========================================================================
// Event Categories (metadata only — no behavior changes)
// ===========================================================================

export type EventCategory =
  | "gameplay"          // Match lifecycle, questions, answers, timers
  | "competition"       // Rating, matchmaking, tournaments, championships
  | "progression"       // XP, levels, achievements, badges, titles
  | "analytics"         // Metrics, dashboards, reports
  | "replay"            // Replay storage, retrieval, markers
  | "social"            // Friends, followers, chat, mentorship
  | "notifications"     // User notifications, alerts
  | "administration"    // Admin actions, appeals, audits
  | "organization"      // School, district, regional, national events
  | "ai"                // AI recommendations, predictions, insights
  | "integration"       // External system integration events
  | "workflow"          // Workflow automation events
  | "custom";           // Custom / mode-specific events

// ===========================================================================
// Event Status (versioning lifecycle)
// ===========================================================================

export type EventStatus =
  | "stable"            // Production-ready, backward-compatible
  | "experimental"      // New, may change, not for production
  | "deprecated"        // Still works but will be removed
  | "removed";          // No longer emitted; consumers should not expect it

// ===========================================================================
// Event Producers (modules that own events)
// ===========================================================================

export type EventProducer =
  | "universal_game_engine"
  | "player_progression"
  | "competitive_platform"
  | "classic_quiz"
  | "treasure_heist"
  | "empire_builder"
  | "quiz_royale"
  | "battle_royale"
  | "analytics"
  | "replay"
  | "notifications"     // future
  | "cosmetics"         // future
  | "social"            // future
  | "ai_director"       // future
  | "organization"      // future
  | "workflow"          // future
  | "integration";      // future

// ===========================================================================
// Idempotency Strategy
// ===========================================================================

export type IdempotencyStrategy =
  | "event_id"          // Dedupe by event.id (default)
  | "idempotency_key"   // Dedupe by metadata.idempotencyKey
  | "match_id"          // Dedupe by matchId + eventType
  | "none";             // No dedup (use with caution)

// ===========================================================================
// Ordering Requirement
// ===========================================================================

export type OrderingRequirement =
  | "strict"            // Consumers must process in order
  | "causal"            // Causation-id ordering respected
  | "none";             // Order-independent (idempotent handlers)

// ===========================================================================
// Persistence Requirement
// ===========================================================================

export type PersistenceRequirement =
  | "required"          // Must persist to event store
  | "optional"          // May persist
  | "transient";        // Never persisted (e.g., timer ticks)

// ===========================================================================
// Standardized Event Metadata
// ===========================================================================

export interface EventMetadata {
  /** Unique identifier for this event instance (UUID). */
  eventId?: string;
  /** Event type name (e.g., "MatchFinished"). */
  eventType?: string;
  /** Semantic version of the event contract (e.g., "1.0.0"). */
  version?: string;
  /** The module that produced this event. */
  producer?: EventProducer;
  /** ISO-8601 timestamp when the event occurred. */
  occurredAt?: string;
  /** Correlation ID for tracing a request across modules. */
  correlationId?: string;
  /** Causation ID — the event that caused this event (causal ordering). */
  causationId?: string;
  /** Distributed tracing ID (e.g., OpenTelemetry trace ID). */
  traceId?: string;
  /** Match ID this event belongs to (if applicable). */
  matchId?: string;
  /** Organization ID this event belongs to (if applicable). */
  organizationId?: string;
  /** User ID this event belongs to (if applicable). */
  userId?: string;
  /** Sequence number within the match (if applicable). */
  sequenceNumber?: number;
  /** Idempotency key — dedup key for at-most-once processing. */
  idempotencyKey?: string;
  /** Whether this event can be replayed. */
  replayable?: boolean;
  /** Whether this event is auditable. */
  auditable?: boolean;
  /** Source system (e.g., "server", "client", "admin-ui"). */
  source?: string;
}

// ===========================================================================
// Event Contract — strongly typed definition
// ===========================================================================

export interface EventContract {
  /** Unique event ID (e.g., "MatchFinished"). */
  eventId: string;
  /** Human-readable display name. */
  displayName: string;
  /** Description of what the event represents. */
  description: string;
  /** The module that owns (produces) this event. Exactly ONE producer. */
  producer: EventProducer;
  /** Modules that consume this event. Unlimited consumers. */
  consumers: EventProducer[];
  /** Event category (metadata only). */
  category: EventCategory;
  /** Payload type name (for documentation). */
  payloadType: string;
  /** JSON schema description of the payload (deterministic). */
  schema: EventSchema;
  /** Semantic version of this contract. */
  version: string;
  /** Lifecycle status. */
  status: EventStatus;
  /** Idempotency strategy for consumers. */
  idempotencyStrategy: IdempotencyStrategy;
  /** Ordering requirement. */
  orderingRequirement: OrderingRequirement;
  /** Persistence requirement. */
  persistenceRequirement: PersistenceRequirement;
  /** Whether replay is supported. */
  replaySupport: boolean;
  /** Whether audit trail is supported. */
  auditSupport: boolean;
  /** Whether this event is deprecated. */
  deprecated: boolean;
  /** Replacement event ID (if deprecated). */
  replacementEventId: string | null;
  /** Deprecation message (if deprecated). */
  deprecationMessage: string | null;
  /** Sample payload for documentation. */
  samplePayload: Record<string, unknown>;
  /** When this contract was registered. */
  registeredAt: string;
}

// ===========================================================================
// Event Schema — deterministic payload description
// ===========================================================================

export interface EventSchema {
  /** Field definitions. */
  fields: EventSchemaField[];
  /** Whether additional fields are allowed. */
  additionalProperties: boolean;
  /** Required field names. */
  required: string[];
}

export interface EventSchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  description: string;
  required: boolean;
  nullable: boolean;
  /** For array types, the element type. */
  items?: "string" | "number" | "boolean" | "object";
  /** Default value (if optional). */
  default?: unknown;
  /** Enum values (if applicable). */
  enum?: string[];
}

// ===========================================================================
// Validation Finding (never mutates payloads)
// ===========================================================================

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationFinding {
  /** The field or path that failed validation. */
  path: string;
  /** The validation rule that failed. */
  rule: string;
  /** Human-readable message. */
  message: string;
  /** Severity level. */
  severity: ValidationSeverity;
  /** The actual value that failed (for debugging). */
  actualValue?: unknown;
  /** The expected value or type. */
  expected?: string;
}

export interface ValidationResult {
  /** Whether the event passed validation (no errors). */
  valid: boolean;
  /** All findings (errors, warnings, info). */
  findings: ValidationFinding[];
  /** The event ID that was validated. */
  eventId: string;
  /** When validation occurred. */
  validatedAt: string;
}

// ===========================================================================
// Event Documentation Entry (auto-generated)
// ===========================================================================

export interface EventDocumentationEntry {
  eventId: string;
  displayName: string;
  description: string;
  producer: EventProducer;
  consumers: EventProducer[];
  category: EventCategory;
  version: string;
  status: EventStatus;
  payloadType: string;
  schema: EventSchema;
  idempotencyStrategy: IdempotencyStrategy;
  orderingRequirement: OrderingRequirement;
  persistenceRequirement: PersistenceRequirement;
  replaySupport: boolean;
  auditSupport: boolean;
  deprecated: boolean;
  replacementEventId: string | null;
  deprecationMessage: string | null;
  samplePayload: Record<string, unknown>;
  registeredAt: string;
  /** Generated documentation sections. */
  purpose: string;
  lifecycle: string;
  bestPractices: string[];
}

export interface EventDocumentation {
  /** When the documentation was generated. */
  generatedAt: string;
  /** Total number of events documented. */
  totalEvents: number;
  /** Documentation entries, sorted by category then eventId. */
  entries: EventDocumentationEntry[];
  /** Summary by category. */
  summaryByCategory: Record<EventCategory, number>;
  /** Summary by producer. */
  summaryByProducer: Record<EventProducer, number>;
}
