/**
 * EduBek — Event Registry.
 *
 * The SINGLE SOURCE OF TRUTH for every platform event. No duplicated
 * event definitions. Every event must be registered here with a
 * strongly-typed contract before it can be emitted or consumed.
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
 *
 * Ownership rules:
 *   - Every event has exactly ONE producer.
 *   - Unlimited consumers may subscribe.
 *   - Consumers never call each other.
 *   - Consumers never publish another module's events.
 *   - Communication occurs only through the Event Bus.
 *
 * Backward compatibility:
 *   - All current events remain valid.
 *   - Existing event names remain valid.
 *   - Current subscribers continue working.
 *   - Existing APIs unchanged.
 *   - No gameplay behavior changes.
 */

import type {
  EventContract,
  EventProducer,
  EventCategory,
} from "./event-types";
import { ALL_EVENT_CONTRACTS } from "./event-contracts";

// ===========================================================================
// In-memory registry
// ===========================================================================

const registry = new Map<string, EventContract>();
const producerIndex = new Map<EventProducer, Set<string>>();
let isInitialized = false;

// ===========================================================================
// Initialization
// ===========================================================================

/**
 * Initialize the registry with all built-in event contracts.
 * Idempotent — calling multiple times has no effect.
 *
 * This is called automatically on first access. Manual calls are safe
 * but unnecessary.
 */
export function initializeRegistry(): void {
  if (isInitialized) return;
  for (const contract of ALL_EVENT_CONTRACTS) {
    registerEventInternal(contract);
  }
  isInitialized = true;
}

/**
 * Register a new event contract.
 *
 * Rules:
 *   - Event ID must be unique (no duplicates).
 *   - Producer must not already own an event with the same ID.
 *   - Once registered, a contract's eventId and producer are immutable.
 *
 * Returns true on success, false if the event is already registered.
 */
export function registerEvent(contract: EventContract): boolean {
  initializeRegistry();
  return registerEventInternal(contract);
}

function registerEventInternal(contract: EventContract): boolean {
  // Check for duplicate event ID
  if (registry.has(contract.eventId)) {
    return false;
  }

  // Validate the contract
  const validation = validateContract(contract);
  if (!validation.valid) {
    return false;
  }

  // Register
  registry.set(contract.eventId, contract);

  // Update producer index
  const producerEvents = producerIndex.get(contract.producer) ?? new Set<string>();
  producerEvents.add(contract.eventId);
  producerIndex.set(contract.producer, producerEvents);

  return true;
}

// ===========================================================================
// Contract validation (internal)
// ===========================================================================

interface ContractValidationResult {
  valid: boolean;
  errors: string[];
}

function validateContract(contract: EventContract): ContractValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!contract.eventId) errors.push("eventId is required");
  if (!contract.displayName) errors.push("displayName is required");
  if (!contract.description) errors.push("description is required");
  if (!contract.producer) errors.push("producer is required");
  if (!contract.payloadType) errors.push("payloadType is required");
  if (!contract.version) errors.push("version is required");
  if (!contract.category) errors.push("category is required");

  // Schema validation
  if (!contract.schema) {
    errors.push("schema is required");
  } else {
    if (!Array.isArray(contract.schema.fields)) {
      errors.push("schema.fields must be an array");
    }
    if (!Array.isArray(contract.schema.required)) {
      errors.push("schema.required must be an array");
    }
  }

  // Deprecated event must have a replacement or message
  if (contract.deprecated && !contract.replacementEventId && !contract.deprecationMessage) {
    errors.push("deprecated events should have a replacementEventId or deprecationMessage");
  }

  // Status consistency
  if (contract.status === "deprecated" && !contract.deprecated) {
    errors.push("status 'deprecated' requires deprecated=true");
  }
  if (contract.status === "removed" && !contract.deprecated) {
    errors.push("status 'removed' requires deprecated=true");
  }

  return { valid: errors.length === 0, errors };
}

// ===========================================================================
// Registry queries
// ===========================================================================

/**
 * Get a contract by event ID. Returns null if not registered.
 */
export function getContract(eventId: string): EventContract | null {
  initializeRegistry();
  return registry.get(eventId) ?? null;
}

/**
 * Check if an event is registered.
 */
export function isRegistered(eventId: string): boolean {
  initializeRegistry();
  return registry.has(eventId);
}

/**
 * List all registered contracts.
 */
export function listEvents(): EventContract[] {
  initializeRegistry();
  return Array.from(registry.values());
}

/**
 * List all events produced by a specific producer.
 */
export function listEventsByProducer(producer: EventProducer): EventContract[] {
  initializeRegistry();
  const eventIds = producerIndex.get(producer) ?? new Set<string>();
  return Array.from(eventIds).map(id => registry.get(id)!).filter(Boolean);
}

/**
 * List all events in a specific category.
 */
export function listEventsByCategory(category: EventCategory): EventContract[] {
  initializeRegistry();
  return Array.from(registry.values()).filter(c => c.category === category);
}

/**
 * List all events consumed by a specific module.
 */
export function listEventsByConsumer(consumer: EventProducer): EventContract[] {
  initializeRegistry();
  return Array.from(registry.values()).filter(c => c.consumers.includes(consumer));
}

/**
 * List all deprecated events.
 */
export function listDeprecatedEvents(): EventContract[] {
  initializeRegistry();
  return Array.from(registry.values()).filter(c => c.deprecated);
}

/**
 * List all stable events.
 */
export function listStableEvents(): EventContract[] {
  initializeRegistry();
  return Array.from(registry.values()).filter(c => c.status === "stable");
}

/**
 * List all experimental events.
 */
export function listExperimentalEvents(): EventContract[] {
  initializeRegistry();
  return Array.from(registry.values()).filter(c => c.status === "experimental");
}

// ===========================================================================
// Ownership queries
// ===========================================================================

/**
 * Get the producer (owner) of an event.
 * Returns null if the event is not registered.
 */
export function getEventProducer(eventId: string): EventProducer | null {
  initializeRegistry();
  return registry.get(eventId)?.producer ?? null;
}

/**
 * Check if a producer is allowed to emit an event.
 * Only the registered producer may emit an event.
 */
export function canProduceEvent(producer: EventProducer, eventId: string): boolean {
  initializeRegistry();
  const contract = registry.get(eventId);
  if (!contract) return false;
  return contract.producer === producer;
}

/**
 * Check if a consumer is registered for an event.
 */
export function canConsumeEvent(consumer: EventProducer, eventId: string): boolean {
  initializeRegistry();
  const contract = registry.get(eventId);
  if (!contract) return false;
  return contract.consumers.includes(consumer);
}

/**
 * Get all consumers for an event.
 */
export function getEventConsumers(eventId: string): EventProducer[] {
  initializeRegistry();
  return registry.get(eventId)?.consumers ?? [];
}

/**
 * Verify that every event has exactly one producer.
 * Returns a list of violations (empty if all good).
 */
export function verifySingleProducerOwnership(): Array<{ eventId: string; issue: string }> {
  initializeRegistry();
  const violations: Array<{ eventId: string; issue: string }> = [];
  for (const [eventId, contract] of registry) {
    if (!contract.producer) {
      violations.push({ eventId, issue: "No producer registered" });
    }
  }
  // Check producer index consistency
  const allProducerEvents = new Map<string, string[]>();
  for (const [producer, eventIds] of producerIndex) {
    for (const eventId of eventIds) {
      const contract = registry.get(eventId);
      if (contract && contract.producer !== producer) {
        violations.push({ eventId, issue: `Producer mismatch: index says ${producer}, contract says ${contract.producer}` });
      }
      const list = allProducerEvents.get(eventId) ?? [];
      list.push(producer);
      allProducerEvents.set(eventId, list);
    }
  }
  // Each event should appear in exactly one producer's index
  for (const [eventId, producers] of allProducerEvents) {
    if (producers.length > 1) {
      violations.push({ eventId, issue: `Multiple producers: ${producers.join(", ")}` });
    }
  }
  return violations;
}

// ===========================================================================
// Registry statistics
// ===========================================================================

export interface RegistryStats {
  totalEvents: number;
  totalProducers: number;
  totalConsumers: number;
  deprecatedCount: number;
  stableCount: number;
  experimentalCount: number;
  removedCount: number;
  byCategory: Record<EventCategory, number>;
  byProducer: Record<string, number>;
}

export function getRegistryStats(): RegistryStats {
  initializeRegistry();
  const all = Array.from(registry.values());
  const byCategory = {} as Record<EventCategory, number>;
  const byProducer: Record<string, number> = {};
  for (const c of all) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    byProducer[c.producer] = (byProducer[c.producer] ?? 0) + 1;
  }
  const allConsumers = new Set<EventProducer>();
  for (const c of all) {
    for (const consumer of c.consumers) allConsumers.add(consumer);
  }
  return {
    totalEvents: all.length,
    totalProducers: producerIndex.size,
    totalConsumers: allConsumers.size,
    deprecatedCount: all.filter(c => c.deprecated).length,
    stableCount: all.filter(c => c.status === "stable").length,
    experimentalCount: all.filter(c => c.status === "experimental").length,
    removedCount: all.filter(c => c.status === "removed").length,
    byCategory,
    byProducer,
  };
}

// ===========================================================================
// Reset for testing
// ===========================================================================

/**
 * Reset the registry to its initial state.
 * Primarily for tests — production never calls this.
 */
export function _resetRegistryForTesting(): void {
  registry.clear();
  producerIndex.clear();
  isInitialized = false;
}
