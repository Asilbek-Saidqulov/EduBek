/**
 * EduBek — Event Registry barrel export.
 *
 * The Event Registry is the governance layer of the Gaming Platform's
 * Event-Driven Architecture. It owns event definitions only — never
 * business logic.
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

// Registry — single source of truth for event definitions
export {
  initializeRegistry,
  registerEvent,
  getContract,
  isRegistered,
  listEvents,
  listEventsByProducer,
  listEventsByCategory,
  listEventsByConsumer,
  listDeprecatedEvents,
  listStableEvents,
  listExperimentalEvents,
  getEventProducer,
  canProduceEvent,
  canConsumeEvent,
  getEventConsumers,
  verifySingleProducerOwnership,
  getRegistryStats,
  _resetRegistryForTesting,
} from "./event-registry";

export type { RegistryStats } from "./event-registry";

// Contracts — strongly typed event definitions
export { ALL_EVENT_CONTRACTS } from "./event-contracts";
export {
  MATCH_CREATED_CONTRACT,
  MATCH_FINISHED_CONTRACT,
  PLAYER_JOINED_CONTRACT,
  PLAYER_LEFT_CONTRACT,
  PLAYER_DISCONNECTED_CONTRACT,
  PLAYER_RECONNECTED_CONTRACT,
  ANSWER_SUBMITTED_CONTRACT,
  SCORE_UPDATED_CONTRACT,
  ROUND_STARTED_CONTRACT,
  ROUND_FINISHED_CONTRACT,
  RESOURCE_CHANGED_CONTRACT,
  TEACHER_OVERRIDE_CONTRACT,
  STATE_TRANSITION_CONTRACT,
  ANTI_CHEAT_FINDING_CONTRACT,
  XP_AWARDED_CONTRACT,
  LEVEL_UP_CONTRACT,
  ACHIEVEMENT_UNLOCKED_CONTRACT,
  MILESTONE_REACHED_CONTRACT,
  RATING_CHANGED_CONTRACT,
  DIVISION_CHANGED_CONTRACT,
  TOURNAMENT_FINISHED_CONTRACT,
  SEASON_COMPLETED_CONTRACT,
  FAIR_PLAY_FINDING_CONTRACT,
  NOTIFICATION_SENT_CONTRACT,
  COSMETIC_UNLOCKED_CONTRACT,
  AI_RECOMMENDATION_CONTRACT,
  LEGACY_SCORE_EVENT_CONTRACT,
} from "./event-contracts";

// Versioning — semantic version + lifecycle management
export {
  parseVersion,
  formatVersion,
  compareVersions,
  versionGreaterThan,
  versionLessThan,
  versionEquals,
  isCompatible,
  getLatestCompatibleVersion,
  canTransition,
  isActiveStatus,
  isEmissionBlocked,
  getMigrationPath,
  getDeprecatedEvents,
  getMigratableEvents,
  getEventsByStatus,
} from "./event-version";

export type { SemanticVersion, MigrationStep } from "./event-version";

// Validator — deterministic validation (never mutates payloads)
export {
  validateEvent,
  isDuplicateEvent,
  markEventSeen,
  hasErrors,
  hasWarnings,
  getFindingsBySeverity,
} from "./event-validator";

export type { EventInput } from "./event-validator";

// Documentation — auto-generated deterministic docs
export {
  generateDocumentation,
  generateMarkdownDocumentation,
  generateJsonDocumentation,
} from "./event-documentation";

// Core types
export type {
  EventCategory,
  EventStatus,
  EventProducer,
  IdempotencyStrategy,
  OrderingRequirement,
  PersistenceRequirement,
  EventMetadata,
  EventContract,
  EventSchema,
  EventSchemaField,
  ValidationSeverity,
  ValidationFinding,
  ValidationResult,
  EventDocumentation,
  EventDocumentationEntry,
} from "./event-types";
