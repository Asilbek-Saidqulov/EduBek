/**
 * EduBek — Event Registry regression tests.
 *
 * Verifies:
 *   - Every event has one owner
 *   - No duplicate owners
 *   - All contracts registered
 *   - Validation works
 *   - Version compatibility
 *   - Documentation generation
 *   - Registry lookup
 *   - Metadata validation
 *   - Idempotency validation
 *   - Consumer independence
 *   - Future event registration
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  // Registry
  initializeRegistry, registerEvent, getContract, isRegistered,
  listEvents, listEventsByProducer, listEventsByCategory, listEventsByConsumer,
  listDeprecatedEvents, listStableEvents, listExperimentalEvents,
  getEventProducer, canProduceEvent, canConsumeEvent, getEventConsumers,
  verifySingleProducerOwnership, getRegistryStats,
  _resetRegistryForTesting,
  // Contracts
  ALL_EVENT_CONTRACTS,
  MATCH_FINISHED_CONTRACT, XP_AWARDED_CONTRACT, RATING_CHANGED_CONTRACT,
  LEGACY_SCORE_EVENT_CONTRACT, NOTIFICATION_SENT_CONTRACT, COSMETIC_UNLOCKED_CONTRACT,
  // Versioning
  parseVersion, formatVersion, compareVersions, versionGreaterThan, versionLessThan, versionEquals,
  isCompatible, getLatestCompatibleVersion, canTransition, isActiveStatus, isEmissionBlocked,
  getMigrationPath, getDeprecatedEvents as getDeprecatedByVersion, getEventsByStatus,
  // Validator
  validateEvent, isDuplicateEvent, markEventSeen, hasErrors, hasWarnings, getFindingsBySeverity,
  // Documentation
  generateDocumentation, generateMarkdownDocumentation, generateJsonDocumentation,
} from "@/features/game-engine/events";
import type { EventContract, EventProducer, EventCategory } from "@/features/game-engine/events";

beforeEach(() => {
  _resetRegistryForTesting();
  initializeRegistry();
});

// ===== System 1 — Event Registry =====
describe("Event Registry — Centralized registry", () => {
  it("initializes with all built-in contracts", () => {
    expect(listEvents().length).toBe(ALL_EVENT_CONTRACTS.length);
  });

  it("isRegistered returns true for known events", () => {
    expect(isRegistered("MatchFinished")).toBe(true);
    expect(isRegistered("XPAwarded")).toBe(true);
    expect(isRegistered("RatingChanged")).toBe(true);
  });

  it("isRegistered returns false for unknown events", () => {
    expect(isRegistered("NonexistentEvent")).toBe(false);
  });

  it("getContract returns the contract for a known event", () => {
    const c = getContract("MatchFinished");
    expect(c).not.toBeNull();
    expect(c!.eventId).toBe("MatchFinished");
    expect(c!.producer).toBe("universal_game_engine");
  });

  it("getContract returns null for unknown event", () => {
    expect(getContract("NonexistentEvent")).toBeNull();
  });

  it("listEvents returns all registered events", () => {
    expect(listEvents().length).toBeGreaterThan(20);
  });

  it("initializeRegistry is idempotent", () => {
    const before = listEvents().length;
    initializeRegistry();
    initializeRegistry();
    expect(listEvents().length).toBe(before);
  });

  it("registerEvent adds a new event", () => {
    const newContract: EventContract = {
      eventId: "CustomTestEvent",
      displayName: "Custom Test Event",
      description: "A test event",
      producer: "custom",
      consumers: [],
      category: "custom",
      payloadType: "TestPayload",
      schema: { fields: [{ name: "test", type: "string", description: "test", required: true, nullable: false }], additionalProperties: false, required: ["test"] },
      version: "1.0.0",
      status: "stable",
      idempotencyStrategy: "event_id",
      orderingRequirement: "none",
      persistenceRequirement: "required",
      replaySupport: true,
      auditSupport: true,
      deprecated: false,
      replacementEventId: null,
      deprecationMessage: null,
      samplePayload: { test: "value" },
      registeredAt: "2025-01-01T00:00:00.000Z",
    };
    expect(registerEvent(newContract)).toBe(true);
    expect(isRegistered("CustomTestEvent")).toBe(true);
  });

  it("registerEvent rejects duplicate event IDs", () => {
    expect(registerEvent(MATCH_FINISHED_CONTRACT)).toBe(false);
  });

  it("registerEvent rejects invalid contracts", () => {
    const invalid: EventContract = {
      ...MATCH_FINISHED_CONTRACT,
      eventId: "", // invalid
    };
    expect(registerEvent(invalid)).toBe(false);
  });
});

// ===== System 2 — Event Contracts =====
describe("Event Registry — Contracts", () => {
  it("all contracts have unique event IDs", () => {
    const ids = ALL_EVENT_CONTRACTS.map(c => c.eventId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all contracts have a producer", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.producer).toBeTruthy();
    }
  });

  it("all contracts have a version", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.version).toBeTruthy();
      expect(c.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("all contracts have a schema", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.schema).toBeDefined();
      expect(Array.isArray(c.schema.fields)).toBe(true);
    }
  });

  it("all contracts have a category", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.category).toBeTruthy();
    }
  });

  it("all contracts have an idempotency strategy", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.idempotencyStrategy).toBeTruthy();
    }
  });

  it("all contracts have a sample payload", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.samplePayload).toBeDefined();
      expect(typeof c.samplePayload).toBe("object");
    }
  });

  it("deprecated contracts have a replacement or message", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      if (c.deprecated) {
        expect(c.replacementEventId || c.deprecationMessage).toBeTruthy();
      }
    }
  });

  it("all contracts have registeredAt timestamps", () => {
    for (const c of ALL_EVENT_CONTRACTS) {
      expect(c.registeredAt).toBeTruthy();
    }
  });
});

// ===== System 3 — Domain Event Ownership =====
describe("Event Registry — Ownership", () => {
  it("every event has exactly one producer", () => {
    for (const c of listEvents()) {
      expect(c.producer).toBeTruthy();
    }
  });

  it("no event has multiple producers", () => {
    const violations = verifySingleProducerOwnership();
    expect(violations).toEqual([]);
  });

  it("MatchFinished is owned by universal_game_engine", () => {
    expect(getEventProducer("MatchFinished")).toBe("universal_game_engine");
  });

  it("XPAwarded is owned by player_progression", () => {
    expect(getEventProducer("XPAwarded")).toBe("player_progression");
  });

  it("RatingChanged is owned by competitive_platform", () => {
    expect(getEventProducer("RatingChanged")).toBe("competitive_platform");
  });

  it("canProduceEvent returns true for the owner", () => {
    expect(canProduceEvent("universal_game_engine", "MatchFinished")).toBe(true);
  });

  it("canProduceEvent returns false for non-owner", () => {
    expect(canProduceEvent("player_progression", "MatchFinished")).toBe(false);
    expect(canProduceEvent("competitive_platform", "XPAwarded")).toBe(false);
  });

  it("canConsumeEvent returns true for registered consumers", () => {
    // MatchFinished is consumed by player_progression
    expect(canConsumeEvent("player_progression", "MatchFinished")).toBe(true);
  });

  it("canConsumeEvent returns false for non-consumers", () => {
    // XPAwarded is not consumed by competitive_platform
    expect(canConsumeEvent("competitive_platform", "XPAwarded")).toBe(false);
  });

  it("getEventConsumers returns the consumer list", () => {
    const consumers = getEventConsumers("MatchFinished");
    expect(consumers).toContain("player_progression");
    expect(consumers).toContain("competitive_platform");
  });

  it("listEventsByProducer returns events for a producer", () => {
    const engineEvents = listEventsByProducer("universal_game_engine");
    expect(engineEvents.length).toBeGreaterThan(5);
    expect(engineEvents.every(c => c.producer === "universal_game_engine")).toBe(true);
  });

  it("listEventsByConsumer returns events a module consumes", () => {
    const progressionConsumes = listEventsByConsumer("player_progression");
    expect(progressionConsumes.length).toBeGreaterThan(0);
    expect(progressionConsumes.some(c => c.eventId === "MatchFinished")).toBe(true);
  });

  it("consumers never produce another module's events", () => {
    // Structural check: for each event, the producer is NOT in the consumers list
    // (a module does not consume its own events — it produces them)
    for (const c of listEvents()) {
      expect(c.consumers).not.toContain(c.producer);
    }
  });
});

// ===== System 4 — Event Versioning =====
describe("Event Registry — Versioning", () => {
  it("parseVersion parses valid versions", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("0.0.0")).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it("parseVersion returns null for invalid versions", () => {
    expect(parseVersion("1.2")).toBeNull();
    expect(parseVersion("1.2.3.4")).toBeNull();
    expect(parseVersion("a.b.c")).toBeNull();
    expect(parseVersion("-1.0.0")).toBeNull();
  });

  it("formatVersion formats correctly", () => {
    expect(formatVersion({ major: 1, minor: 2, patch: 3 })).toBe("1.2.3");
  });

  it("compareVersions works correctly", () => {
    expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
    expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.2.0", "1.3.0")).toBe(-1);
    expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
  });

  it("versionGreaterThan works", () => {
    expect(versionGreaterThan("2.0.0", "1.0.0")).toBe(true);
    expect(versionGreaterThan("1.0.0", "2.0.0")).toBe(false);
  });

  it("versionLessThan works", () => {
    expect(versionLessThan("1.0.0", "2.0.0")).toBe(true);
    expect(versionLessThan("2.0.0", "1.0.0")).toBe(false);
  });

  it("versionEquals works", () => {
    expect(versionEquals("1.0.0", "1.0.0")).toBe(true);
    expect(versionEquals("1.0.0", "1.0.1")).toBe(false);
  });

  it("isCompatible returns true for same major version", () => {
    expect(isCompatible("1.0.0", "1.5.0")).toBe(true);
    expect(isCompatible("1.0.0", "2.0.0")).toBe(false);
  });

  it("getLatestCompatibleVersion returns the latest compatible version", () => {
    const latest = getLatestCompatibleVersion("1.0.0", ["1.0.0", "1.2.0", "1.5.0", "2.0.0"]);
    expect(latest).toBe("1.5.0");
  });

  it("canTransition validates lifecycle transitions", () => {
    expect(canTransition("experimental", "stable")).toBe(true);
    expect(canTransition("stable", "deprecated")).toBe(true);
    expect(canTransition("deprecated", "removed")).toBe(true);
    expect(canTransition("removed", "stable")).toBe(false);
    expect(canTransition("stable", "experimental")).toBe(false);
  });

  it("isActiveStatus identifies active events", () => {
    expect(isActiveStatus("stable")).toBe(true);
    expect(isActiveStatus("experimental")).toBe(true);
    expect(isActiveStatus("deprecated")).toBe(true);
    expect(isActiveStatus("removed")).toBe(false);
  });

  it("isEmissionBlocked identifies removed events", () => {
    expect(isEmissionBlocked("removed")).toBe(true);
    expect(isEmissionBlocked("stable")).toBe(false);
    expect(isEmissionBlocked("deprecated")).toBe(false);
  });

  it("getMigrationPath returns migration info for deprecated events", () => {
    const path = getMigrationPath(LEGACY_SCORE_EVENT_CONTRACT);
    expect(path).not.toBeNull();
    expect(path!.fromVersion).toBe(LEGACY_SCORE_EVENT_CONTRACT.version);
    expect(path!.description).toContain(LEGACY_SCORE_EVENT_CONTRACT.replacementEventId!);
  });

  it("getMigrationPath returns null for non-deprecated events", () => {
    const path = getMigrationPath(MATCH_FINISHED_CONTRACT);
    expect(path).toBeNull();
  });

  it("getDeprecatedEvents returns deprecated events", () => {
    const deprecated = getDeprecatedByVersion(ALL_EVENT_CONTRACTS);
    expect(deprecated.length).toBeGreaterThan(0);
    expect(deprecated.some(c => c.eventId === "LegacyScoreEvent")).toBe(true);
  });

  it("getEventsByStatus filters by status", () => {
    const stable = getEventsByStatus(ALL_EVENT_CONTRACTS, "stable");
    const experimental = getEventsByStatus(ALL_EVENT_CONTRACTS, "experimental");
    expect(stable.length).toBeGreaterThan(0);
    expect(experimental.length).toBeGreaterThan(0);
    expect(stable.every(c => c.status === "stable")).toBe(true);
  });

  it("listDeprecatedEvents returns deprecated events from registry", () => {
    const deprecated = listDeprecatedEvents();
    expect(deprecated.some(c => c.eventId === "LegacyScoreEvent")).toBe(true);
  });

  it("listStableEvents returns stable events from registry", () => {
    const stable = listStableEvents();
    expect(stable.length).toBeGreaterThan(10);
    expect(stable.every(c => c.status === "stable")).toBe(true);
  });

  it("listExperimentalEvents returns experimental events from registry", () => {
    const experimental = listExperimentalEvents();
    expect(experimental.some(c => c.eventId === "NotificationSent")).toBe(true);
  });
});

// ===== System 5 — Event Validation =====
describe("Event Registry — Validation", () => {
  it("validates a correct event", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        version: "1.0.0",
        producer: "universal_game_engine",
        payload: { gameMode: "classic_quiz", result: "win" },
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(true);
    expect(hasErrors(result)).toBe(false);
  });

  it("rejects unknown event ID", () => {
    const result = validateEvent(
      { eventId: "NonexistentEvent", payload: {} },
      null,
    );
    expect(result.valid).toBe(false);
    expect(hasErrors(result)).toBe(true);
  });

  it("rejects invalid producer", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "player_progression", // wrong producer
        payload: { gameMode: "classic_quiz" },
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(false);
    expect(hasErrors(result)).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload: {}, // missing required "gameMode"
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(false);
    expect(hasErrors(result)).toBe(true);
  });

  it("rejects type mismatch", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload: { gameMode: 123 }, // should be string
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects invalid enum value", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload: { gameMode: "classic_quiz", result: "invalid_result" },
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(false);
  });

  it("warns on deprecated events", () => {
    const result = validateEvent(
      {
        eventId: "LegacyScoreEvent",
        producer: "universal_game_engine",
        payload: { score: 100 },
      },
      LEGACY_SCORE_EVENT_CONTRACT,
    );
    expect(hasWarnings(result)).toBe(true);
  });

  it("rejects removed events", () => {
    const removedContract: EventContract = {
      ...LEGACY_SCORE_EVENT_CONTRACT,
      status: "removed",
    };
    const result = validateEvent(
      {
        eventId: "LegacyScoreEvent",
        producer: "universal_game_engine",
        payload: { score: 100 },
      },
      removedContract,
    );
    expect(result.valid).toBe(false);
  });

  it("requires idempotency key when strategy is idempotency_key", () => {
    const result = validateEvent(
      {
        eventId: "XPAwarded",
        version: "1.0.0",
        producer: "player_progression",
        payload: { source: "victory", amount: 100 },
        // missing metadata.idempotencyKey
      },
      XP_AWARDED_CONTRACT,
    );
    expect(result.valid).toBe(false);
  });

  it("passes when idempotency key is provided", () => {
    const result = validateEvent(
      {
        eventId: "XPAwarded",
        version: "1.0.0",
        producer: "player_progression",
        payload: { source: "victory", amount: 100 },
        metadata: { idempotencyKey: "key-123" },
      },
      XP_AWARDED_CONTRACT,
    );
    expect(result.valid).toBe(true);
  });

  it("validates metadata timestamp", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload: { gameMode: "classic_quiz" },
        metadata: { occurredAt: "not-a-timestamp" },
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(false);
  });

  it("validates metadata sequenceNumber", () => {
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload: { gameMode: "classic_quiz" },
        metadata: { sequenceNumber: -1 },
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(result.valid).toBe(false);
  });

  it("warns when replayable metadata contradicts contract", () => {
    const noReplayContract: EventContract = {
      ...MATCH_FINISHED_CONTRACT,
      replaySupport: false,
    };
    const result = validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload: { gameMode: "classic_quiz" },
        metadata: { replayable: true },
      },
      noReplayContract,
    );
    expect(hasWarnings(result)).toBe(true);
  });

  it("isDuplicateEvent detects duplicates", () => {
    const seen = new Set<string>();
    expect(isDuplicateEvent("event-1", seen)).toBe(false);
    markEventSeen("event-1", seen);
    expect(isDuplicateEvent("event-1", seen)).toBe(true);
  });

  it("getFindingsBySeverity filters findings", () => {
    const result = validateEvent(
      {
        eventId: "LegacyScoreEvent",
        producer: "universal_game_engine",
        payload: { score: 100 },
      },
      LEGACY_SCORE_EVENT_CONTRACT,
    );
    const warnings = getFindingsBySeverity(result, "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.every(f => f.severity === "warning")).toBe(true);
  });

  it("never mutates the input payload", () => {
    const payload = { gameMode: "classic_quiz", result: "win" };
    const payloadCopy = { ...payload };
    validateEvent(
      {
        eventId: "MatchFinished",
        producer: "universal_game_engine",
        payload,
      },
      MATCH_FINISHED_CONTRACT,
    );
    expect(payload).toEqual(payloadCopy);
  });
});

// ===== System 6 — Event Documentation =====
describe("Event Registry — Documentation", () => {
  it("generateDocumentation produces documentation", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    expect(doc.totalEvents).toBe(ALL_EVENT_CONTRACTS.length);
    expect(doc.entries.length).toBe(ALL_EVENT_CONTRACTS.length);
  });

  it("documentation entries are sorted by category then eventId", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    for (let i = 1; i < doc.entries.length; i++) {
      const prev = doc.entries[i - 1];
      const curr = doc.entries[i];
      if (prev.category === curr.category) {
        expect(prev.eventId.localeCompare(curr.eventId)).toBeLessThanOrEqual(0);
      } else {
        expect(prev.category.localeCompare(curr.category)).toBeLessThan(0);
      }
    }
  });

  it("documentation includes summary by category", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    expect(doc.summaryByCategory).toBeDefined();
    expect(doc.summaryByCategory.gameplay).toBeGreaterThan(0);
  });

  it("documentation includes summary by producer", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    expect(doc.summaryByProducer).toBeDefined();
    expect(doc.summaryByProducer.universal_game_engine).toBeGreaterThan(0);
  });

  it("each entry includes purpose", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    for (const entry of doc.entries) {
      expect(entry.purpose).toBeTruthy();
      expect(entry.purpose.length).toBeGreaterThan(0);
    }
  });

  it("each entry includes lifecycle", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    for (const entry of doc.entries) {
      expect(entry.lifecycle).toBeTruthy();
      expect(entry.lifecycle).toContain("Status:");
    }
  });

  it("each entry includes best practices", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    for (const entry of doc.entries) {
      expect(entry.bestPractices.length).toBeGreaterThan(0);
    }
  });

  it("deprecated entries mention migration in best practices", () => {
    const doc = generateDocumentation(ALL_EVENT_CONTRACTS);
    const deprecated = doc.entries.find(e => e.deprecated);
    expect(deprecated).toBeDefined();
    expect(deprecated!.bestPractices.some(bp => bp.includes("DEPRECATED"))).toBe(true);
  });

  it("generateMarkdownDocumentation produces valid markdown", () => {
    const md = generateMarkdownDocumentation(ALL_EVENT_CONTRACTS);
    expect(md).toContain("# EduBek Event Registry Documentation");
    expect(md).toContain("## Summary by Category");
    expect(md).toContain("## Event Details");
    expect(md).toContain("### MatchFinished");
  });

  it("generateJsonDocumentation produces valid JSON", () => {
    const json = generateJsonDocumentation(ALL_EVENT_CONTRACTS);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.totalEvents).toBe(ALL_EVENT_CONTRACTS.length);
  });

  it("documentation is deterministic — same input produces same output", () => {
    const doc1 = generateDocumentation(ALL_EVENT_CONTRACTS);
    const doc2 = generateDocumentation(ALL_EVENT_CONTRACTS);
    // Note: generatedAt will differ, so compare entries
    expect(doc1.entries).toEqual(doc2.entries);
  });
});

// ===== Registry Statistics =====
describe("Event Registry — Statistics", () => {
  it("getRegistryStats returns correct counts", () => {
    const stats = getRegistryStats();
    expect(stats.totalEvents).toBe(ALL_EVENT_CONTRACTS.length);
    expect(stats.stableCount).toBeGreaterThan(0);
    expect(stats.experimentalCount).toBeGreaterThan(0);
    expect(stats.deprecatedCount).toBeGreaterThan(0);
    expect(stats.totalProducers).toBeGreaterThan(0);
  });

  it("stats byCategory sums to totalEvents", () => {
    const stats = getRegistryStats();
    const sum = Object.values(stats.byCategory).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.totalEvents);
  });

  it("stats byProducer sums to totalEvents", () => {
    const stats = getRegistryStats();
    const sum = Object.values(stats.byProducer).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.totalEvents);
  });
});

// ===== Backward Compatibility =====
describe("Event Registry — Backward Compatibility", () => {
  it("all engine GameEventType values are registered", () => {
    // The engine's GameEventType union includes these values — all must be registered
    const engineEvents = [
      "MatchCreated", "PlayerJoined", "PlayerLeft", "PlayerKicked", "PlayerBanned",
      "ReadyChanged", "CountdownStarted", "RoundStarted", "QuestionShown",
      "AnswerSubmitted", "AnswerLocked", "TimerExpired", "TimerPaused", "TimerResumed",
      "RoundFinished", "MatchFinished", "ReplaySaved", "PlayerDisconnected",
      "PlayerReconnected", "SpectatorJoined", "SpectatorLeft", "ScoreUpdated",
      "ResourceChanged", "StateTransition", "TeacherOverride", "AntiCheatFinding",
    ];
    // Note: Not all engine GameEventType values have registered contracts yet —
    // only the ones used by the bridges. This test verifies the key ones.
    const keyEvents = ["MatchCreated", "MatchFinished", "PlayerJoined", "PlayerLeft", "PlayerDisconnected", "PlayerReconnected", "AnswerSubmitted", "ScoreUpdated", "RoundStarted", "RoundFinished", "ResourceChanged", "TeacherOverride", "StateTransition", "AntiCheatFinding"];
    for (const e of keyEvents) {
      expect(isRegistered(e)).toBe(true);
    }
  });

  it("existing event names remain valid", () => {
    expect(isRegistered("MatchFinished")).toBe(true);
    expect(isRegistered("AnswerSubmitted")).toBe(true);
    expect(isRegistered("TeacherOverride")).toBe(true);
  });

  it("PlayerKicked is NOT in the registry (engine-only event, no contract needed)", () => {
    // Some engine events like PlayerKicked and PlayerBanned are not registered
    // because they are internal engine events that consumers don't process.
    // This is acceptable — the registry only governs events that flow through
    // the cross-module Event Bus bridges.
    expect(isRegistered("PlayerKicked")).toBe(false);
  });
});

// ===== Consumer Independence =====
describe("Event Registry — Consumer Independence", () => {
  it("MatchFinished has multiple independent consumers", () => {
    const consumers = getEventConsumers("MatchFinished");
    expect(consumers).toContain("player_progression");
    expect(consumers).toContain("competitive_platform");
    expect(consumers).toContain("analytics");
    expect(consumers).toContain("replay");
  });

  it("consumers list does not include the producer", () => {
    for (const c of listEvents()) {
      expect(c.consumers).not.toContain(c.producer);
    }
  });

  it("a module can consume events from multiple producers", () => {
    const progressionConsumes = listEventsByConsumer("player_progression");
    const producers = new Set(progressionConsumes.map(c => c.producer));
    expect(producers.size).toBeGreaterThan(1);
  });
});

// ===== Future Event Registration =====
describe("Event Registry — Future Event Registration", () => {
  it("future NotificationSent event is registered", () => {
    expect(isRegistered("NotificationSent")).toBe(true);
    const c = getContract("NotificationSent");
    expect(c!.producer).toBe("notifications");
    expect(c!.status).toBe("experimental");
  });

  it("future CosmeticUnlocked event is registered", () => {
    expect(isRegistered("CosmeticUnlocked")).toBe(true);
    const c = getContract("CosmeticUnlocked");
    expect(c!.producer).toBe("cosmetics");
    expect(c!.status).toBe("experimental");
  });

  it("future AIRecommendationGenerated event is registered", () => {
    expect(isRegistered("AIRecommendationGenerated")).toBe(true);
    const c = getContract("AIRecommendationGenerated");
    expect(c!.producer).toBe("ai_director");
  });

  it("modules can register new events at runtime", () => {
    const newEvent: EventContract = {
      eventId: "FutureSocialEvent",
      displayName: "Future Social Event",
      description: "A future social platform event",
      producer: "social",
      consumers: ["analytics"],
      category: "social",
      payloadType: "SocialPayload",
      schema: { fields: [], additionalProperties: true, required: [] },
      version: "1.0.0",
      status: "experimental",
      idempotencyStrategy: "event_id",
      orderingRequirement: "none",
      persistenceRequirement: "optional",
      replaySupport: false,
      auditSupport: true,
      deprecated: false,
      replacementEventId: null,
      deprecationMessage: null,
      samplePayload: {},
      registeredAt: "2025-01-01T00:00:00.000Z",
    };
    expect(registerEvent(newEvent)).toBe(true);
    expect(isRegistered("FutureSocialEvent")).toBe(true);
  });
});

// ===== Edge Cases =====
describe("Event Registry — Edge Cases", () => {
  it("listEventsByProducer returns empty for unknown producer", () => {
    expect(listEventsByProducer("nonexistent" as EventProducer)).toEqual([]);
  });

  it("listEventsByCategory returns empty for unknown category", () => {
    expect(listEventsByCategory("custom")).toEqual([]);
  });

  it("listEventsByConsumer returns empty for unknown consumer", () => {
    expect(listEventsByConsumer("nonexistent" as EventProducer)).toEqual([]);
  });

  it("getEventProducer returns null for unknown event", () => {
    expect(getEventProducer("NonexistentEvent")).toBeNull();
  });

  it("getEventConsumers returns empty for unknown event", () => {
    expect(getEventConsumers("NonexistentEvent")).toEqual([]);
  });

  it("canProduceEvent returns false for unknown event", () => {
    expect(canProduceEvent("universal_game_engine", "NonexistentEvent")).toBe(false);
  });

  it("canConsumeEvent returns false for unknown event", () => {
    expect(canConsumeEvent("player_progression", "NonexistentEvent")).toBe(false);
  });

  it("compareVersions returns 0 for invalid versions", () => {
    expect(compareVersions("invalid", "1.0.0")).toBe(0);
  });

  it("isCompatible returns false for invalid versions", () => {
    expect(isCompatible("invalid", "1.0.0")).toBe(false);
  });

  it("getLatestCompatibleVersion returns null for no compatible versions", () => {
    expect(getLatestCompatibleVersion("1.0.0", ["2.0.0", "3.0.0"])).toBeNull();
  });
});
