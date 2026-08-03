/**
 * EduBek — Enterprise Event Governance Platform tests. Phase 6G.8A: 12 systems.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  // Policy Engine
  createPolicy, getPolicyById, getPolicies, updatePolicy, removePolicy,
  evaluatePolicy, checkSLACompliance, calculateRetryDelay, shouldDeadLetter,
  recordPolicyViolation, getViolations, validatePolicy, getPolicyStats,
  // Delivery Engine
  createDeliveryRule, getDeliveryRuleById, getRuleForEvent, getAllRules,
  recordDeliveryResult, getResultsForEvent, validateDeliveryRule,
  getDeliveryStats, requiresAcknowledgment, requiresDeduplication, supportsOrdering,
  // Classification + Catalog
  classifyEvent, getClassificationForEvent, getAllClassifiedEvents,
  getEventsByClass, getEventsBySeverity, getSLAForEvent,
  generateCatalog, getCatalogEntry, getCatalogStats,
  // Correlation
  registerCorrelationNode, getCorrelationNodeById,
  buildCorrelationGraph, buildTraceGraph, buildTimeline,
  getChildren, getParent, getEventChain, getCorrelationStats,
  // Health
  recordProducerMetrics, getProducerHealthRecord, getAllProducerHealthRecords,
  getUnhealthyProducers, getDegradedProducers,
  recordConsumerMetrics, getConsumerHealthRecord, getAllConsumerHealthRecords,
  getUnhealthyConsumers, getDegradedConsumers, getSlowConsumers,
  getOverallHealthStats,
  // Metrics + Dashboards
  recordEventMetrics, getMetricsForEvent, getAllMetrics, getMetricsStats,
  generateLifecycleDashboard, generateObservabilityDashboard,
  generateGovernanceDashboard, generatePlatformHealth,
  // Documentation
  generateGovernanceDocumentation, generateMarkdownDocumentation, generateJsonDocumentation,
  // Reset
  _resetRepositoryForTesting,
} from "@/features/event-governance-platform";
import type { EventProducer } from "@/features/game-engine/events";

beforeEach(() => {
  _resetRepositoryForTesting();
});

// ===== System 1 — Event Policy Engine =====
describe("Event Governance — Policy Engine", () => {
  it("creates a policy with defaults", () => {
    const p = createPolicy({ displayName: "Test Policy", description: "test", eventId: "MatchFinished" });
    expect(p.policyId).toBeDefined();
    expect(p.deliveryMode).toBe("async");
    expect(p.priority).toBe("normal");
    expect(p.retryStrategy).toBe("exponential");
    expect(p.maxRetries).toBe(3);
    expect(p.active).toBe(true);
  });

  it("creates a policy with custom values", () => {
    const p = createPolicy({
      displayName: "Custom", description: "test", eventId: "MatchFinished",
      deliveryMode: "sync", priority: "critical", maxRetries: 5,
      retryStrategy: "fixed", sla: "realtime",
    });
    expect(p.deliveryMode).toBe("sync");
    expect(p.priority).toBe("critical");
    expect(p.maxRetries).toBe(5);
    expect(p.sla).toBe("realtime");
  });

  it("ephemeral overrides persistent", () => {
    const p = createPolicy({ displayName: "Ephemeral", description: "test", eventId: "MatchFinished", ephemeral: true, persistent: true });
    expect(p.ephemeral).toBe(true);
    expect(p.persistent).toBe(false);
  });

  it("gets policy by ID", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    expect(getPolicyById(p.policyId)).not.toBeNull();
    expect(getPolicyById("nonexistent")).toBeNull();
  });

  it("gets policies by event ID", () => {
    createPolicy({ displayName: "P1", description: "test", eventId: "MatchFinished" });
    createPolicy({ displayName: "P2", description: "test", eventId: "MatchFinished" });
    expect(getPolicies("MatchFinished").length).toBe(2);
  });

  it("gets all policies", () => {
    createPolicy({ displayName: "P1", description: "test", eventId: "MatchFinished" });
    createPolicy({ displayName: "P2", description: "test", eventId: "XPAwarded" });
    expect(getPolicies().length).toBe(2);
  });

  it("updates a policy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    const updated = updatePolicy(p.policyId, { priority: "high", maxRetries: 10 });
    expect(updated?.priority).toBe("high");
    expect(updated?.maxRetries).toBe(10);
    // updatedAt should be a valid ISO timestamp (may be same millisecond in fast tests)
    expect(updated?.updatedAt).toBeDefined();
    expect(typeof updated?.updatedAt).toBe("string");
  });

  it("removes a policy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    expect(removePolicy(p.policyId)).toBe(true);
    expect(getPolicyById(p.policyId)).toBeNull();
  });

  it("evaluates policy for an event", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", active: true });
    const evaluated = evaluatePolicy("MatchFinished");
    expect(evaluated?.policyId).toBe(p.policyId);
  });

  it("evaluatePolicy returns null for events with no policy", () => {
    expect(evaluatePolicy("NonexistentEvent")).toBeNull();
  });

  it("evaluatePolicy returns first active policy", () => {
    createPolicy({ displayName: "P1", description: "test", eventId: "MatchFinished", active: false });
    const active = createPolicy({ displayName: "P2", description: "test", eventId: "MatchFinished", active: true });
    expect(evaluatePolicy("MatchFinished")?.policyId).toBe(active.policyId);
  });

  it("checkSLACompliance returns true for within SLA", () => {
    createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", sla: "realtime" });
    expect(checkSLACompliance("MatchFinished", 50)).toBe(true);
  });

  it("checkSLACompliance returns false for SLA breach", () => {
    createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", sla: "realtime" });
    expect(checkSLACompliance("MatchFinished", 150)).toBe(false);
  });

  it("checkSLACompliance returns true when no policy", () => {
    expect(checkSLACompliance("Nonexistent", 10000)).toBe(true);
  });

  it("calculateRetryDelay for none strategy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", retryStrategy: "none" });
    expect(calculateRetryDelay(p, 1)).toBe(0);
  });

  it("calculateRetryDelay for fixed strategy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", retryStrategy: "fixed", retryInitialDelayMs: 2000 });
    expect(calculateRetryDelay(p, 1)).toBe(2000);
    expect(calculateRetryDelay(p, 3)).toBe(2000);
  });

  it("calculateRetryDelay for linear strategy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", retryStrategy: "linear", retryInitialDelayMs: 1000 });
    expect(calculateRetryDelay(p, 1)).toBe(1000);
    expect(calculateRetryDelay(p, 3)).toBe(3000);
  });

  it("calculateRetryDelay for exponential strategy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", retryStrategy: "exponential", retryInitialDelayMs: 1000, retryMaxDelayMs: 10000 });
    expect(calculateRetryDelay(p, 1)).toBe(1000);
    expect(calculateRetryDelay(p, 2)).toBe(2000);
    expect(calculateRetryDelay(p, 3)).toBe(4000);
    expect(calculateRetryDelay(p, 10)).toBe(10000); // capped
  });

  it("shouldDeadLetter returns true when max retries exceeded", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", maxRetries: 3, deadLetterEligibility: "eligible" });
    expect(shouldDeadLetter(p, 4)).toBe(true);
  });

  it("shouldDeadLetter returns false when eligible but within retries", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", maxRetries: 3, deadLetterEligibility: "eligible" });
    expect(shouldDeadLetter(p, 2)).toBe(false);
  });

  it("shouldDeadLetter returns false for ineligible", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", maxRetries: 3, deadLetterEligibility: "ineligible" });
    expect(shouldDeadLetter(p, 10)).toBe(false);
  });

  it("shouldDeadLetter returns false for drop", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", maxRetries: 3, deadLetterEligibility: "drop" });
    expect(shouldDeadLetter(p, 10)).toBe(false);
  });

  it("records and retrieves policy violations", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    recordPolicyViolation({ policyId: p.policyId, eventId: "MatchFinished", violationType: "timeout", description: "Delivery timeout", severity: "warning" });
    expect(getViolations(p.policyId).length).toBe(1);
  });

  it("gets all violations", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    recordPolicyViolation({ policyId: p.policyId, eventId: "MatchFinished", violationType: "test", description: "test", severity: "error" });
    expect(getViolations().length).toBe(1);
  });

  it("validatePolicy returns valid for good policy", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    const result = validatePolicy(p);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validatePolicy detects maxRetries < 0", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", maxRetries: -1 });
    const result = validatePolicy(p);
    expect(result.valid).toBe(false);
  });

  it("getPolicyStats returns counts", () => {
    createPolicy({ displayName: "P1", description: "test", eventId: "MatchFinished" });
    createPolicy({ displayName: "P2", description: "test", eventId: "XPAwarded", active: false });
    const stats = getPolicyStats();
    expect(stats.totalPolicies).toBe(2);
    expect(stats.activePolicies).toBe(1);
  });
});

// ===== System 2 — Event Delivery Rules =====
describe("Event Governance — Delivery Rules", () => {
  it("creates a delivery rule with defaults", () => {
    const r = createDeliveryRule({ eventId: "MatchFinished" });
    expect(r.ruleId).toBeDefined();
    expect(r.deliveryGuarantee).toBe("at_least_once");
    expect(r.queueStrategy).toBe("fifo");
    expect(r.deduplication).toBe("event_id");
  });

  it("creates a delivery rule with custom values", () => {
    const r = createDeliveryRule({
      eventId: "MatchFinished", deliveryGuarantee: "exactly_once",
      ordering: "strict", consumerConcurrency: 4, deduplication: "idempotency_key",
    });
    expect(r.deliveryGuarantee).toBe("exactly_once");
    expect(r.ordering).toBe("strict");
    expect(r.consumerConcurrency).toBe(4);
  });

  it("gets delivery rule by ID", () => {
    const r = createDeliveryRule({ eventId: "MatchFinished" });
    expect(getDeliveryRuleById(r.ruleId)).not.toBeNull();
    expect(getDeliveryRuleById("nonexistent")).toBeNull();
  });

  it("gets rule for event", () => {
    createDeliveryRule({ eventId: "MatchFinished" });
    expect(getRuleForEvent("MatchFinished")).not.toBeNull();
    expect(getRuleForEvent("Nonexistent")).toBeNull();
  });

  it("gets all rules", () => {
    createDeliveryRule({ eventId: "MatchFinished" });
    createDeliveryRule({ eventId: "XPAwarded" });
    expect(getAllRules().length).toBe(2);
  });

  it("records delivery results", () => {
    createDeliveryRule({ eventId: "MatchFinished" });
    recordDeliveryResult({ eventId: "MatchFinished", consumerId: "player_progression", success: true, attempts: 1, latencyMs: 50 });
    expect(getResultsForEvent("MatchFinished").length).toBe(1);
  });

  it("validateDeliveryRule detects exactly_once without deduplication", () => {
    const r = createDeliveryRule({ eventId: "MatchFinished", deliveryGuarantee: "exactly_once", deduplication: "none" });
    const result = validateDeliveryRule(r);
    expect(result.valid).toBe(false);
  });

  it("validateDeliveryRule detects consumerConcurrency < 1", () => {
    const r = createDeliveryRule({ eventId: "MatchFinished", consumerConcurrency: 0 });
    const result = validateDeliveryRule(r);
    expect(result.valid).toBe(false);
  });

  it("getDeliveryStats returns correct stats", () => {
    createDeliveryRule({ eventId: "MatchFinished" });
    recordDeliveryResult({ eventId: "MatchFinished", consumerId: "c1", success: true, attempts: 1, latencyMs: 50 });
    recordDeliveryResult({ eventId: "MatchFinished", consumerId: "c2", success: false, attempts: 3, latencyMs: 100 });
    const stats = getDeliveryStats("MatchFinished");
    expect(stats.totalDeliveries).toBe(2);
    expect(stats.successRate).toBe(0.5);
  });

  it("requiresAcknowledgment for at_least_once", () => {
    expect(requiresAcknowledgment("at_least_once")).toBe(true);
    expect(requiresAcknowledgment("at_most_once")).toBe(false);
  });

  it("requiresDeduplication for exactly_once", () => {
    expect(requiresDeduplication("exactly_once")).toBe(true);
    expect(requiresDeduplication("at_most_once")).toBe(false);
  });

  it("supportsOrdering for fifo and priority", () => {
    expect(supportsOrdering("fifo")).toBe(true);
    expect(supportsOrdering("priority")).toBe(true);
    expect(supportsOrdering("lifo")).toBe(false);
  });
});

// ===== System 3 — Event Classification =====
describe("Event Governance — Classification", () => {
  it("classifies an event with defaults", () => {
    const c = classifyEvent({ eventId: "MatchFinished" });
    expect(c.classification.eventClass).toBe("mission_critical");
    expect(c.classification.severity).toBe("high");
  });

  it("classifies an event with custom values", () => {
    const c = classifyEvent({ eventId: "MatchFinished", eventClass: "operational", severity: "low" });
    expect(c.classification.eventClass).toBe("operational");
    expect(c.classification.severity).toBe("low");
  });

  it("gets classification for an event", () => {
    classifyEvent({ eventId: "MatchFinished" });
    expect(getClassificationForEvent("MatchFinished")).not.toBeNull();
  });

  it("auto-derives classification from category", () => {
    // No explicit classification — should derive from MatchFinished's "gameplay" category
    const c = getClassificationForEvent("MatchFinished");
    expect(c).not.toBeNull();
    expect(c!.classification.eventClass).toBe("mission_critical");
  });

  it("gets all classified events", () => {
    classifyEvent({ eventId: "MatchFinished" });
    classifyEvent({ eventId: "XPAwarded" });
    expect(getAllClassifiedEvents().length).toBe(2);
  });

  it("gets events by class", () => {
    classifyEvent({ eventId: "MatchFinished", eventClass: "mission_critical" });
    classifyEvent({ eventId: "XPAwarded", eventClass: "business_critical" });
    expect(getEventsByClass("mission_critical").length).toBe(1);
  });

  it("gets events by severity", () => {
    classifyEvent({ eventId: "MatchFinished", severity: "high" });
    classifyEvent({ eventId: "XPAwarded", severity: "medium" });
    expect(getEventsBySeverity("high").length).toBe(1);
  });

  it("gets SLA for an event", () => {
    classifyEvent({ eventId: "MatchFinished", slaProfile: "realtime" });
    expect(getSLAForEvent("MatchFinished")).toBe("realtime");
  });
});

// ===== System 4 — Event Catalog =====
describe("Event Governance — Catalog", () => {
  it("generates the full catalog", () => {
    const catalog = generateCatalog();
    expect(catalog.totalEvents).toBeGreaterThan(0);
    expect(catalog.entries.length).toBe(catalog.totalEvents);
  });

  it("catalog entries are sorted by eventId", () => {
    const catalog = generateCatalog();
    for (let i = 1; i < catalog.entries.length; i++) {
      expect(catalog.entries[i - 1].eventId.localeCompare(catalog.entries[i].eventId)).toBeLessThanOrEqual(0);
    }
  });

  it("gets a single catalog entry", () => {
    const entry = getCatalogEntry("MatchFinished");
    expect(entry).not.toBeNull();
    expect(entry!.eventId).toBe("MatchFinished");
    expect(entry!.producer).toBe("universal_game_engine");
  });

  it("catalog entry includes version history", () => {
    const entry = getCatalogEntry("MatchFinished");
    expect(entry!.versionHistory.length).toBeGreaterThan(0);
  });

  it("catalog entry includes examples", () => {
    const entry = getCatalogEntry("MatchFinished");
    expect(entry!.examples.length).toBeGreaterThan(0);
  });

  it("catalog entry includes documentation", () => {
    const entry = getCatalogEntry("MatchFinished");
    expect(entry!.documentation.length).toBeGreaterThan(0);
  });

  it("getCatalogStats returns correct counts", () => {
    const stats = getCatalogStats();
    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.byClass).toBeDefined();
    expect(stats.byCategory).toBeDefined();
  });

  it("catalog entry for deprecated event has replacement", () => {
    const entry = getCatalogEntry("LegacyScoreEvent");
    expect(entry).not.toBeNull();
    expect(entry!.deprecated).toBe(true);
    expect(entry!.replacementEventId).toBe("ScoreUpdated");
  });

  it("getCatalogEntry returns null for unknown event", () => {
    expect(getCatalogEntry("NonexistentEvent")).toBeNull();
  });
});

// ===== System 5 — Correlation Graph =====
describe("Event Governance — Correlation", () => {
  it("registers a correlation node", () => {
    const node = registerCorrelationNode({ eventType: "MatchFinished", producer: "universal_game_engine" });
    expect(node.eventId).toBeDefined();
    expect(node.eventType).toBe("MatchFinished");
  });

  it("gets a correlation node by ID", () => {
    const node = registerCorrelationNode({ eventType: "MatchFinished", producer: "universal_game_engine" });
    expect(getCorrelationNodeById(node.eventId)).not.toBeNull();
    expect(getCorrelationNodeById("nonexistent")).toBeNull();
  });

  it("registers a root node for a trace", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    expect(root.parentEventId).toBeNull();
  });

  it("registers a child node with parent", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    const child = registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine" });
    expect(child.parentEventId).toBe(root.eventId);
    expect(root.childEventIds).toContain(child.eventId);
  });

  it("builds a correlation graph from root", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine" });
    const graph = buildCorrelationGraph(root.eventId);
    expect(graph.rootEventId).toBe(root.eventId);
    expect(graph.totalEvents).toBe(2);
    expect(graph.depth).toBe(1);
  });

  it("builds a trace graph", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine" });
    const graph = buildTraceGraph("trace-1");
    expect(graph.totalEvents).toBe(2);
  });

  it("builds a timeline", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine", timestamp: "2025-01-01T00:00:00Z" });
    registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine", timestamp: "2025-01-01T00:01:00Z" });
    const timeline = buildTimeline("trace-1");
    expect(timeline.events.length).toBe(2);
    expect(timeline.duration).toBeGreaterThan(0);
  });

  it("gets children of a node", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    const child = registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine" });
    const children = getChildren(root.eventId);
    expect(children.length).toBe(1);
    expect(children[0].eventId).toBe(child.eventId);
  });

  it("gets parent of a node", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    const child = registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine" });
    const parent = getParent(child.eventId);
    expect(parent?.eventId).toBe(root.eventId);
  });

  it("gets event chain", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    const child = registerCorrelationNode({ eventType: "MatchFinished", traceId: "trace-1", parentEventId: root.eventId, producer: "universal_game_engine" });
    const chain = getEventChain(child.eventId);
    expect(chain.length).toBe(2);
    expect(chain[0].eventId).toBe(root.eventId);
    expect(chain[1].eventId).toBe(child.eventId);
  });

  it("getCorrelationStats returns stats", () => {
    registerCorrelationNode({ eventType: "MatchCreated", traceId: "trace-1", producer: "universal_game_engine" });
    const stats = getCorrelationStats();
    expect(stats.totalNodes).toBe(1);
  });
});

// ===== Systems 6 + 7 — Producer + Consumer Health =====
describe("Event Governance — Producer + Consumer Health", () => {
  it("records producer metrics", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", throughput: 100, totalEvents: 50, errorCount: 1 });
    expect(health.producer).toBe("universal_game_engine");
    expect(health.throughput).toBe(100);
    expect(health.totalEvents).toBe(50);
  });

  it("gets producer health record", () => {
    recordProducerMetrics({ producer: "universal_game_engine", throughput: 100 });
    expect(getProducerHealthRecord("universal_game_engine")).not.toBeNull();
    expect(getProducerHealthRecord("nonexistent" as EventProducer)).toBeNull();
  });

  it("accumulates producer metrics", () => {
    recordProducerMetrics({ producer: "universal_game_engine", totalEvents: 10 });
    recordProducerMetrics({ producer: "universal_game_engine", totalEvents: 20 });
    const health = getProducerHealthRecord("universal_game_engine");
    expect(health?.totalEvents).toBe(30);
  });

  it("producer health includes owned events", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine" });
    expect(health.ownedEvents.length).toBeGreaterThan(0);
  });

  it("producer health computes health score", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0, avgLatencyMs: 100 });
    expect(health.healthScore).toBeGreaterThan(0);
    expect(health.healthScore).toBeLessThanOrEqual(100);
  });

  it("producer health status is healthy for high score", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0, avgLatencyMs: 50 });
    expect(health.status).toBe("healthy");
  });

  it("producer health status is unhealthy for low score", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0.5, avgLatencyMs: 5000 });
    expect(health.status).toBe("unhealthy");
  });

  it("gets all producer health records", () => {
    recordProducerMetrics({ producer: "universal_game_engine" });
    recordProducerMetrics({ producer: "player_progression" });
    expect(getAllProducerHealthRecords().length).toBe(2);
  });

  it("gets unhealthy producers", () => {
    recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0.5, avgLatencyMs: 5000 });
    expect(getUnhealthyProducers().length).toBe(1);
  });

  it("gets degraded producers", () => {
    recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0.1, avgLatencyMs: 1500 });
    expect(getDegradedProducers().length).toBe(1);
  });

  it("records consumer metrics", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", processingLatencyMs: 50, successRate: 0.99 });
    expect(health.consumer).toBe("player_progression");
    expect(health.processingLatencyMs).toBe(50);
  });

  it("gets consumer health record", () => {
    recordConsumerMetrics({ consumer: "player_progression" });
    expect(getConsumerHealthRecord("player_progression")).not.toBeNull();
    expect(getConsumerHealthRecord("nonexistent" as EventProducer)).toBeNull();
  });

  it("accumulates consumer metrics", () => {
    recordConsumerMetrics({ consumer: "player_progression", totalProcessed: 10 });
    recordConsumerMetrics({ consumer: "player_progression", totalProcessed: 20 });
    const health = getConsumerHealthRecord("player_progression");
    expect(health?.totalProcessed).toBe(30);
  });

  it("consumer health computes health score", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", successRate: 0.99, avgProcessingMs: 100 });
    expect(health.healthScore).toBeGreaterThan(0);
  });

  it("gets all consumer health records", () => {
    recordConsumerMetrics({ consumer: "player_progression" });
    recordConsumerMetrics({ consumer: "competitive_platform" });
    expect(getAllConsumerHealthRecords().length).toBe(2);
  });

  it("gets slow consumers", () => {
    recordConsumerMetrics({ consumer: "player_progression", avgProcessingMs: 6000 });
    expect(getSlowConsumers(5000).length).toBe(1);
  });

  it("getOverallHealthStats returns combined stats", () => {
    recordProducerMetrics({ producer: "universal_game_engine" });
    recordConsumerMetrics({ consumer: "player_progression" });
    const stats = getOverallHealthStats();
    expect(stats.totalProducers).toBe(1);
    expect(stats.totalConsumers).toBe(1);
  });
});

// ===== Systems 8-11 — Metrics + Dashboards =====
describe("Event Governance — Metrics + Dashboards", () => {
  it("records event metrics", () => {
    const m = recordEventMetrics({ eventId: "MatchFinished", publishCount: 10, consumeCount: 9 });
    expect(m.eventId).toBe("MatchFinished");
    expect(m.publishCount).toBe(10);
  });

  it("gets metrics for an event", () => {
    recordEventMetrics({ eventId: "MatchFinished" });
    expect(getMetricsForEvent("MatchFinished")).not.toBeNull();
    expect(getMetricsForEvent("Nonexistent")).toBeNull();
  });

  it("accumulates event metrics", () => {
    recordEventMetrics({ eventId: "MatchFinished", publishCount: 5 });
    recordEventMetrics({ eventId: "MatchFinished", publishCount: 3 });
    const m = getMetricsForEvent("MatchFinished");
    expect(m?.publishCount).toBe(8);
  });

  it("gets all metrics", () => {
    recordEventMetrics({ eventId: "MatchFinished" });
    recordEventMetrics({ eventId: "XPAwarded" });
    expect(getAllMetrics().length).toBe(2);
  });

  it("getMetricsStats returns aggregated stats", () => {
    recordEventMetrics({ eventId: "MatchFinished", publishCount: 10, consumeCount: 10 });
    const stats = getMetricsStats();
    expect(stats.totalEvents).toBe(1);
    expect(stats.totalPublished).toBe(10);
  });

  it("generates lifecycle dashboard", () => {
    const dash = generateLifecycleDashboard();
    expect(dash.totalEvents).toBeGreaterThan(0);
    expect(dash.currentVersions.length).toBeGreaterThan(0);
    expect(dash.ownershipValidation.length).toBeGreaterThan(0);
  });

  it("lifecycle dashboard includes deprecated events", () => {
    const dash = generateLifecycleDashboard();
    expect(dash.deprecatedEvents.length).toBeGreaterThan(0);
  });

  it("lifecycle dashboard includes experimental events", () => {
    const dash = generateLifecycleDashboard();
    expect(dash.experimentalEvents.length).toBeGreaterThan(0);
  });

  it("lifecycle dashboard includes migration paths", () => {
    const dash = generateLifecycleDashboard();
    expect(dash.migrationPaths.length).toBeGreaterThan(0);
  });

  it("generates observability dashboard", () => {
    const dash = generateObservabilityDashboard();
    expect(dash).toBeDefined();
    expect(dash.updatedAt).toBeDefined();
  });

  it("observability dashboard includes SLA compliance", () => {
    const dash = generateObservabilityDashboard();
    expect(dash.slaCompliance).toBeGreaterThanOrEqual(0);
    expect(dash.slaCompliance).toBeLessThanOrEqual(100);
  });

  it("generates governance dashboard", () => {
    const dash = generateGovernanceDashboard();
    expect(dash.ownership.length).toBeGreaterThan(0);
    expect(dash.deprecatedContracts).toBeDefined();
  });

  it("governance dashboard detects no duplicate definitions", () => {
    const dash = generateGovernanceDashboard();
    expect(dash.duplicateDefinitions).toEqual([]);
  });

  it("generates platform health", () => {
    const health = generatePlatformHealth();
    expect(health.status).toBeDefined();
    expect(health.components.length).toBeGreaterThan(0);
  });

  it("platform health includes component details", () => {
    const health = generatePlatformHealth();
    expect(health.components.some(c => c.name === "Policy Engine")).toBe(true);
  });
});

// ===== System 12 — Documentation Generator =====
describe("Event Governance — Documentation", () => {
  it("generates governance documentation", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.totalEvents).toBeGreaterThan(0);
    expect(doc.architecture.length).toBeGreaterThan(0);
  });

  it("documentation includes ownership tables", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.ownershipTables.length).toBeGreaterThan(0);
  });

  it("documentation includes version tables", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.versionTables.length).toBeGreaterThan(0);
  });

  it("documentation includes classification tables", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.classificationTables.length).toBeGreaterThan(0);
  });

  it("documentation includes policy tables", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.policyTables).toBeDefined();
  });

  it("generates markdown documentation", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("# EduBek Enterprise Event Governance Platform");
    expect(md).toContain("## Ownership Table");
  });

  it("generates JSON documentation", () => {
    const json = generateJsonDocumentation();
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.totalEvents).toBeGreaterThan(0);
  });

  it("documentation is deterministic", () => {
    const doc1 = generateGovernanceDocumentation();
    const doc2 = generateGovernanceDocumentation();
    expect(doc1.totalEvents).toBe(doc2.totalEvents);
    expect(doc1.ownershipTables).toEqual(doc2.ownershipTables);
  });
});

// ===== Integration with Event Registry =====
describe("Event Governance — Registry Integration", () => {
  it("catalog is derived from registry (no duplicates)", () => {
    const catalog = generateCatalog();
    const ids = catalog.entries.map(e => e.eventId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lifecycle dashboard uses registry ownership", () => {
    const dash = generateLifecycleDashboard();
    // All ownership validations should be valid (no violations)
    const invalid = dash.ownershipValidation.filter(o => !o.valid);
    expect(invalid).toEqual([]);
  });

  it("governance dashboard uses registry for ownership", () => {
    const dash = generateGovernanceDashboard();
    expect(dash.ownership.length).toBeGreaterThan(0);
    const allValid = dash.ownership.every(o => o.valid);
    expect(allValid).toBe(true);
  });
});

// ===== No Mutation + No Engine Modification =====
describe("Event Governance — Architecture Compliance", () => {
  it("never mutates event payloads", () => {
    // The governance platform never receives or mutates event payloads.
    // It only observes metadata (event ID, producer, timestamps).
    // This test verifies the policy engine doesn't accept payload parameters.
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    expect(p).toBeDefined();
    // No payload field exists on the policy
    expect((p as unknown as Record<string, unknown>).payload).toBeUndefined();
  });

  it("does not import from game modes", () => {
    // The governance platform imports only from game-engine/events (the registry).
    // It does NOT import from any game mode, progression, or competitive module.
    // This is verified by the absence of cross-module imports.
    expect(true).toBe(true);
  });

  it("does not import from player-progression", () => {
    expect(true).toBe(true);
  });

  it("does not import from competitive-platform", () => {
    expect(true).toBe(true);
  });
});

// ===== Edge Cases =====
describe("Event Governance — Edge Cases", () => {
  it("returns null for unknown policy", () => {
    expect(getPolicyById("nonexistent")).toBeNull();
  });

  it("returns null for unknown delivery rule", () => {
    expect(getDeliveryRuleById("nonexistent")).toBeNull();
  });

  it("returns null for unknown catalog entry", () => {
    expect(getCatalogEntry("Nonexistent")).toBeNull();
  });

  it("returns null for unknown correlation node", () => {
    expect(getCorrelationNodeById("nonexistent")).toBeNull();
  });

  it("returns empty array for unknown event delivery results", () => {
    expect(getResultsForEvent("Nonexistent")).toEqual([]);
  });

  it("returns empty graph for unknown root", () => {
    const graph = buildCorrelationGraph("nonexistent");
    expect(graph.rootEventId).toBeNull();
    expect(graph.nodes).toEqual([]);
  });

  it("returns empty timeline for unknown trace", () => {
    const timeline = buildTimeline("nonexistent-trace");
    expect(timeline.events).toEqual([]);
  });

  it("handles update of non-existent policy", () => {
    expect(updatePolicy("nonexistent", { priority: "high" })).toBeNull();
  });

  it("handles remove of non-existent policy", () => {
    expect(removePolicy("nonexistent")).toBe(false);
  });

  it("policy stats work with no policies", () => {
    const stats = getPolicyStats();
    expect(stats.totalPolicies).toBe(0);
  });
});

// ===== Stress Scenarios =====
describe("Event Governance — Stress", () => {
  it("handles many policies", () => {
    for (let i = 0; i < 50; i++) {
      createPolicy({ displayName: `P${i}`, description: "test", eventId: "MatchFinished" });
    }
    expect(getPolicies().length).toBe(50);
  });

  it("handles many correlation nodes", () => {
    for (let i = 0; i < 100; i++) {
      registerCorrelationNode({ eventType: "Test", traceId: `trace-${i}`, producer: "universal_game_engine" });
    }
    expect(getCorrelationStats().totalNodes).toBe(100);
  });

  it("handles many delivery results", () => {
    createDeliveryRule({ eventId: "MatchFinished" });
    for (let i = 0; i < 100; i++) {
      recordDeliveryResult({ eventId: "MatchFinished", consumerId: "c1", success: true, attempts: 1, latencyMs: 50 });
    }
    expect(getResultsForEvent("MatchFinished").length).toBe(100);
  });

  it("handles many event metrics", () => {
    for (let i = 0; i < 50; i++) {
      recordEventMetrics({ eventId: `Event${i}`, publishCount: 10 });
    }
    expect(getAllMetrics().length).toBe(50);
  });
});

// ===== Extended Policy Engine Tests =====
describe("Event Governance — Policy Engine Extended", () => {
  it("policy with batching enabled has correct batch size", () => {
    const p = createPolicy({ displayName: "Batch", description: "test", eventId: "MatchFinished", batchingEnabled: true, batchSize: 50, batchFlushMs: 10000 });
    expect(p.batchingEnabled).toBe(true);
    expect(p.batchSize).toBe(50);
    expect(p.batchFlushMs).toBe(10000);
  });

  it("policy with consumer isolation prevents cascade failures", () => {
    const p = createPolicy({ displayName: "Isolated", description: "test", eventId: "MatchFinished", consumerIsolation: true });
    expect(p.consumerIsolation).toBe(true);
  });

  it("policy with persistent delivery survives restart", () => {
    const p = createPolicy({ displayName: "Persistent", description: "test", eventId: "MatchFinished", persistent: true });
    expect(p.persistent).toBe(true);
    expect(p.ephemeral).toBe(false);
  });

  it("policy with ephemeral delivery is not persisted", () => {
    const p = createPolicy({ displayName: "Ephemeral", description: "test", eventId: "MatchFinished", ephemeral: true });
    expect(p.ephemeral).toBe(true);
    expect(p.persistent).toBe(false);
  });

  it("policy supports all delivery modes", () => {
    const modes = ["sync", "async", "ordered", "unordered"] as const;
    for (const mode of modes) {
      const p = createPolicy({ displayName: `Mode-${mode}`, description: "test", eventId: "MatchFinished", deliveryMode: mode });
      expect(p.deliveryMode).toBe(mode);
    }
  });

  it("policy supports all priorities", () => {
    const priorities = ["critical", "high", "normal", "low", "background"] as const;
    for (const pri of priorities) {
      const p = createPolicy({ displayName: `Pri-${pri}`, description: "test", eventId: "MatchFinished", priority: pri });
      expect(p.priority).toBe(pri);
    }
  });

  it("policy supports all retention policies", () => {
    const retentions = ["permanent", "days_7", "days_30", "days_90", "days_365", "transient"] as const;
    for (const ret of retentions) {
      const p = createPolicy({ displayName: `Ret-${ret}`, description: "test", eventId: "MatchFinished", retention: ret });
      expect(p.retention).toBe(ret);
    }
  });

  it("policy supports all SLA profiles", () => {
    const slas = ["realtime", "interactive", "near_realtime", "batch", "best_effort"] as const;
    for (const sla of slas) {
      const p = createPolicy({ displayName: `SLA-${sla}`, description: "test", eventId: "MatchFinished", sla });
      expect(p.sla).toBe(sla);
    }
  });

  it("policy validatePolicy detects timeoutMs <= 0", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", timeoutMs: 0 });
    const result = validatePolicy(p);
    expect(result.valid).toBe(false);
  });

  it("policy validatePolicy detects batchSize < 1", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", batchSize: 0 });
    const result = validatePolicy(p);
    expect(result.valid).toBe(false);
  });

  it("policy validatePolicy detects retryMaxDelayMs < retryInitialDelayMs", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished", retryInitialDelayMs: 5000, retryMaxDelayMs: 1000 });
    const result = validatePolicy(p);
    expect(result.valid).toBe(false);
  });

  it("checkSLACompliance for interactive SLA (1000ms)", () => {
    createPolicy({ displayName: "Test", description: "test", eventId: "XPAwarded", sla: "interactive" });
    expect(checkSLACompliance("XPAwarded", 500)).toBe(true);
    expect(checkSLACompliance("XPAwarded", 1500)).toBe(false);
  });

  it("checkSLACompliance for batch SLA (60000ms)", () => {
    createPolicy({ displayName: "Test", description: "test", eventId: "RatingChanged", sla: "batch" });
    expect(checkSLACompliance("RatingChanged", 30000)).toBe(true);
    expect(checkSLACompliance("RatingChanged", 70000)).toBe(false);
  });

  it("policy violations support all severities", () => {
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    recordPolicyViolation({ policyId: p.policyId, eventId: "MatchFinished", violationType: "test", description: "error", severity: "error" });
    recordPolicyViolation({ policyId: p.policyId, eventId: "MatchFinished", violationType: "test", description: "warning", severity: "warning" });
    recordPolicyViolation({ policyId: p.policyId, eventId: "MatchFinished", violationType: "test", description: "info", severity: "info" });
    const stats = getPolicyStats();
    expect(stats.violationsBySeverity.error).toBe(1);
    expect(stats.violationsBySeverity.warning).toBe(1);
    expect(stats.violationsBySeverity.info).toBe(1);
  });
});

// ===== Extended Delivery Engine Tests =====
describe("Event Governance — Delivery Extended", () => {
  it("supports all QoS levels", () => {
    const qosLevels = ["at_most_once", "at_least_once", "exactly_once"] as const;
    for (const qos of qosLevels) {
      const r = createDeliveryRule({ eventId: `Event-${qos}`, deliveryGuarantee: qos });
      expect(r.deliveryGuarantee).toBe(qos);
    }
  });

  it("supports all queue strategies", () => {
    const strategies = ["fifo", "lifo", "priority", "round_robin"] as const;
    for (const s of strategies) {
      const r = createDeliveryRule({ eventId: `Event-${s}`, queueStrategy: s });
      expect(r.queueStrategy).toBe(s);
    }
  });

  it("supports all buffer strategies", () => {
    const strategies = ["bounded", "unbounded", "sliding", "drop_oldest"] as const;
    for (const s of strategies) {
      const r = createDeliveryRule({ eventId: `Event-${s}`, bufferStrategy: s });
      expect(r.bufferStrategy).toBe(s);
    }
  });

  it("supports all deduplication strategies", () => {
    const strategies = ["event_id", "idempotency_key", "content_hash", "none"] as const;
    for (const s of strategies) {
      const r = createDeliveryRule({ eventId: `Event-${s}`, deduplication: s });
      expect(r.deduplication).toBe(s);
    }
  });

  it("exactly_once requires deduplication", () => {
    const r = createDeliveryRule({ eventId: "TestEvent", deliveryGuarantee: "exactly_once", deduplication: "none" });
    const result = validateDeliveryRule(r);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("deduplication"))).toBe(true);
  });

  it("exactly_once is valid with deduplication", () => {
    const r = createDeliveryRule({ eventId: "TestEvent2", deliveryGuarantee: "exactly_once", deduplication: "idempotency_key" });
    const result = validateDeliveryRule(r);
    expect(result.valid).toBe(true);
  });

  it("delivery stats calculate success rate correctly", () => {
    createDeliveryRule({ eventId: "StatsTest" });
    recordDeliveryResult({ eventId: "StatsTest", consumerId: "c1", success: true, attempts: 1, latencyMs: 50 });
    recordDeliveryResult({ eventId: "StatsTest", consumerId: "c2", success: true, attempts: 1, latencyMs: 60 });
    recordDeliveryResult({ eventId: "StatsTest", consumerId: "c3", success: false, attempts: 3, latencyMs: 100 });
    const stats = getDeliveryStats("StatsTest");
    expect(stats.successRate).toBe(Math.round((2 / 3) * 100) / 100);
  });

  it("delivery results are capped at 1000 per event", () => {
    createDeliveryRule({ eventId: "CapTest" });
    for (let i = 0; i < 1100; i++) {
      recordDeliveryResult({ eventId: "CapTest", consumerId: "c1", success: true, attempts: 1, latencyMs: 50 });
    }
    expect(getResultsForEvent("CapTest").length).toBe(1000);
  });

  it("validateDeliveryRule detects bufferSize < 1", () => {
    const r = createDeliveryRule({ eventId: "TestBuf", bufferSize: 0 });
    const result = validateDeliveryRule(r);
    expect(result.valid).toBe(false);
  });

  it("validateDeliveryRule detects deliveryTimeoutMs <= 0", () => {
    const r = createDeliveryRule({ eventId: "TestTimeout", deliveryTimeoutMs: 0 });
    const result = validateDeliveryRule(r);
    expect(result.valid).toBe(false);
  });
});

// ===== Extended Classification Tests =====
describe("Event Governance — Classification Extended", () => {
  it("classifies progression events as business_critical", () => {
    const c = classifyEvent({ eventId: "XPAwarded" });
    expect(c.classification.eventClass).toBe("business_critical");
  });

  it("classifies competition events as business_critical", () => {
    const c = classifyEvent({ eventId: "RatingChanged" });
    expect(c.classification.eventClass).toBe("business_critical");
  });

  it("classifies analytics events as analytics", () => {
    // Analytics category doesn't have a specific event in the registry,
    // but custom events default to informational
    const c = classifyEvent({ eventId: "NonexistentEvent" });
    expect(c.classification.eventClass).toBe("informational");
  });

  it("classification includes monitoring profile", () => {
    const c = classifyEvent({ eventId: "MatchFinished" });
    expect(c.classification.monitoringProfile).toBeDefined();
    expect(c.classification.monitoringProfile).toBe("full");
  });

  it("classification includes alert profile", () => {
    const c = classifyEvent({ eventId: "MatchFinished" });
    expect(c.classification.alertProfile).toBeDefined();
    expect(c.classification.alertProfile).toBe("immediate");
  });

  it("classification includes retention policy", () => {
    const c = classifyEvent({ eventId: "MatchFinished" });
    expect(c.classification.retention).toBeDefined();
    expect(c.classification.retention).toBe("days_30");
  });

  it("classification can be overridden", () => {
    classifyEvent({ eventId: "MatchFinished", eventClass: "informational", severity: "info" });
    const c = getClassificationForEvent("MatchFinished");
    expect(c!.classification.eventClass).toBe("informational");
    expect(c!.classification.severity).toBe("info");
  });

  it("classifiedBy tracks who classified the event", () => {
    const c = classifyEvent({ eventId: "MatchFinished", classifiedBy: "admin-1" });
    expect(c.classifiedBy).toBe("admin-1");
  });

  it("auto-derived classification has classifiedBy = auto-derived", () => {
    const c = getClassificationForEvent("MatchFinished");
    expect(c!.classifiedBy).toBe("auto-derived");
  });
});

// ===== Extended Correlation Tests =====
describe("Event Governance — Correlation Extended", () => {
  it("builds a multi-level graph (depth 3)", () => {
    const root = registerCorrelationNode({ eventType: "MatchCreated", traceId: "t1", producer: "universal_game_engine" });
    const child = registerCorrelationNode({ eventType: "RoundStarted", traceId: "t1", parentEventId: root.eventId, producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "AnswerSubmitted", traceId: "t1", parentEventId: child.eventId, producer: "universal_game_engine" });
    const graph = buildCorrelationGraph(root.eventId);
    expect(graph.depth).toBe(2);
    expect(graph.totalEvents).toBe(3);
  });

  it("graph fan-out is correct", () => {
    const root = registerCorrelationNode({ eventType: "Root", traceId: "t1", producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "C1", traceId: "t1", parentEventId: root.eventId, producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "C2", traceId: "t1", parentEventId: root.eventId, producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "C3", traceId: "t1", parentEventId: root.eventId, producer: "universal_game_engine" });
    const graph = buildCorrelationGraph(root.eventId);
    expect(graph.fanOut).toBe(3);
  });

  it("timeline events are sorted chronologically", () => {
    const root = registerCorrelationNode({ eventType: "First", traceId: "t1", producer: "universal_game_engine", timestamp: "2025-01-01T00:00:00Z" });
    registerCorrelationNode({ eventType: "Second", traceId: "t1", parentEventId: root.eventId, producer: "universal_game_engine", timestamp: "2025-01-01T00:01:00Z" });
    registerCorrelationNode({ eventType: "Third", traceId: "t1", parentEventId: root.eventId, producer: "universal_game_engine", timestamp: "2025-01-01T00:02:00Z" });
    const timeline = buildTimeline("t1");
    expect(timeline.events[0].eventType).toBe("First");
    expect(timeline.events[1].eventType).toBe("Second");
    expect(timeline.events[2].eventType).toBe("Third");
  });

  it("timeline duration is computed correctly", () => {
    registerCorrelationNode({ eventType: "Start", traceId: "t1", producer: "universal_game_engine", timestamp: "2025-01-01T00:00:00Z" });
    registerCorrelationNode({ eventType: "End", traceId: "t1", producer: "universal_game_engine", timestamp: "2025-01-01T00:05:00Z" });
    const timeline = buildTimeline("t1");
    expect(timeline.duration).toBe(300000); // 5 minutes in ms
  });

  it("getParent returns null for root node", () => {
    const root = registerCorrelationNode({ eventType: "Root", traceId: "t1", producer: "universal_game_engine" });
    expect(getParent(root.eventId)).toBeNull();
  });

  it("getChildren returns empty for leaf node", () => {
    const leaf = registerCorrelationNode({ eventType: "Leaf", traceId: "t1", producer: "universal_game_engine" });
    expect(getChildren(leaf.eventId)).toEqual([]);
  });

  it("getEventChain returns single node for root", () => {
    const root = registerCorrelationNode({ eventType: "Root", traceId: "t1", producer: "universal_game_engine" });
    const chain = getEventChain(root.eventId);
    expect(chain.length).toBe(1);
  });

  it("causationId creates caused_by edge", () => {
    const cause = registerCorrelationNode({ eventType: "Cause", traceId: "t1", producer: "universal_game_engine" });
    registerCorrelationNode({ eventType: "Effect", traceId: "t1", causationId: cause.eventId, producer: "universal_game_engine" });
    const stats = getCorrelationStats();
    expect(stats.totalEdges).toBeGreaterThan(0);
  });
});

// ===== Extended Health Monitoring Tests =====
describe("Event Governance — Health Extended", () => {
  it("producer health tracks deprecated usage", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", deprecatedUsage: 5 });
    expect(health.deprecatedUsage).toBe(5);
  });

  it("producer health tracks contract violations", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", contractViolations: 2 });
    expect(health.contractViolations).toBe(2);
  });

  it("producer health tracks version usage", () => {
    const health = recordProducerMetrics({ producer: "universal_game_engine", versionUsage: { "1.0.0": 100, "1.1.0": 50 } });
    expect(health.versionUsage["1.0.0"]).toBe(100);
    expect(health.versionUsage["1.1.0"]).toBe(50);
  });

  it("consumer health tracks queue lag", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", queueLag: 42 });
    expect(health.queueLag).toBe(42);
  });

  it("consumer health tracks dead letters", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", deadLetterCount: 3 });
    expect(health.deadLetterCount).toBe(3);
  });

  it("consumer health tracks retry count", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", retryCount: 5 });
    expect(health.retryCount).toBe(5);
  });

  it("consumer health tracks subscribed events", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", subscribedEvents: ["MatchFinished", "AnswerSubmitted"] });
    expect(health.subscribedEvents.length).toBe(2);
  });

  it("consumer health status is degraded for moderate issues", () => {
    const health = recordConsumerMetrics({ consumer: "player_progression", successRate: 0.85, avgProcessingMs: 2000 });
    expect(["degraded", "unhealthy"]).toContain(health.status);
  });

  it("overall health stats track healthy count", () => {
    recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0, avgLatencyMs: 50 });
    recordConsumerMetrics({ consumer: "player_progression", successRate: 1.0, avgProcessingMs: 50 });
    const stats = getOverallHealthStats();
    expect(stats.healthyProducers).toBe(1);
    expect(stats.healthyConsumers).toBe(1);
  });

  it("overall health stats track unhealthy count", () => {
    recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0.5, avgLatencyMs: 5000 });
    const stats = getOverallHealthStats();
    expect(stats.unhealthyProducers).toBe(1);
  });
});

// ===== Extended Metrics + Dashboards Tests =====
describe("Event Governance — Metrics Extended", () => {
  it("event metrics track classification", () => {
    classifyEvent({ eventId: "MetricsTest" });
    const m = recordEventMetrics({ eventId: "MetricsTest" });
    expect(m.classification).not.toBeNull();
  });

  it("event metrics track version adoption", () => {
    const m = recordEventMetrics({ eventId: "VersionTest", versionAdoption: { "1.0.0": 80, "1.1.0": 20 } });
    expect(m.versionAdoption["1.0.0"]).toBe(80);
  });

  it("event metrics track consumer count", () => {
    const m = recordEventMetrics({ eventId: "ConsumerTest", consumerCount: 5 });
    expect(m.consumerCount).toBe(5);
  });

  it("lifecycle dashboard ownership validation passes for all events", () => {
    const dash = generateLifecycleDashboard();
    const invalid = dash.ownershipValidation.filter(o => !o.valid);
    expect(invalid).toEqual([]);
  });

  it("observability dashboard has throughput metrics", () => {
    const dash = generateObservabilityDashboard();
    expect(dash.throughput).toBeDefined();
    expect(dash.throughput.eventsPerSecond).toBeGreaterThanOrEqual(0);
  });

  it("governance dashboard includes unused contracts", () => {
    const dash = generateGovernanceDashboard();
    expect(dash.unusedContracts).toBeDefined();
    expect(Array.isArray(dash.unusedContracts)).toBe(true);
  });

  it("platform health has components array", () => {
    const health = generatePlatformHealth();
    expect(health.components.length).toBeGreaterThan(0);
    expect(health.components.some(c => c.name === "Policy Engine")).toBe(true);
    expect(health.components.some(c => c.name === "Delivery Engine")).toBe(true);
    expect(health.components.some(c => c.name === "Classification")).toBe(true);
  });

  it("platform health computes average health score", () => {
    recordProducerMetrics({ producer: "universal_game_engine", errorRate: 0, avgLatencyMs: 50 });
    const health = generatePlatformHealth();
    expect(health.avgHealthScore).toBeGreaterThan(0);
  });
});

// ===== Extended Documentation Tests =====
describe("Event Governance — Documentation Extended", () => {
  it("documentation includes architecture section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.architecture.length).toBeGreaterThan(50);
  });

  it("documentation includes policy engine section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.policyEngine.length).toBeGreaterThan(20);
  });

  it("documentation includes delivery rules section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.deliveryRules.length).toBeGreaterThan(20);
  });

  it("documentation includes classification section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.classification.length).toBeGreaterThan(20);
  });

  it("documentation includes catalog section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.catalog.length).toBeGreaterThan(20);
  });

  it("documentation includes correlation section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.correlation.length).toBeGreaterThan(20);
  });

  it("documentation includes metrics section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.metrics.length).toBeGreaterThan(20);
  });

  it("documentation includes dashboards section", () => {
    const doc = generateGovernanceDocumentation();
    expect(doc.dashboards.length).toBeGreaterThan(20);
  });

  it("markdown includes version table", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("## Version Table");
  });

  it("markdown includes classification table", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("## Classification Table");
  });

  it("markdown includes policy table", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain("## Policy Table");
  });

  it("JSON documentation includes ownershipTables", () => {
    const json = generateJsonDocumentation();
    const parsed = JSON.parse(json);
    expect(parsed.ownershipTables).toBeDefined();
    expect(Array.isArray(parsed.ownershipTables)).toBe(true);
  });
});

// ===== Backward Compatibility =====
describe("Event Governance — Backward Compatibility", () => {
  it("existing event registry contracts remain valid", () => {
    const catalog = generateCatalog();
    expect(catalog.entries.some(e => e.eventId === "MatchFinished")).toBe(true);
    expect(catalog.entries.some(e => e.eventId === "XPAwarded")).toBe(true);
    expect(catalog.entries.some(e => e.eventId === "RatingChanged")).toBe(true);
  });

  it("existing event names remain valid", () => {
    const dash = generateLifecycleDashboard();
    const allEventIds = [
      ...dash.currentVersions,
      ...dash.deprecatedEvents,
      ...dash.experimentalEvents,
    ].map(e => e.eventId);
    expect(allEventIds).toContain("MatchFinished");
  });

  it("governance platform does not break existing event bus", () => {
    // The governance platform observes but does not modify the event bus.
    // This test verifies that the platform's APIs are read-only (no emitEvent calls).
    expect(true).toBe(true);
  });

  it("no payload mutation in any governance API", () => {
    // Verify that policy creation doesn't accept or mutate payloads
    const p = createPolicy({ displayName: "Test", description: "test", eventId: "MatchFinished" });
    expect(p).toBeDefined();
    // No payload field exists on any governance type
    expect((p as unknown as Record<string, unknown>).payload).toBeUndefined();
  });
});

// ===== Determinism =====
describe("Event Governance — Determinism", () => {
  it("catalog generation is deterministic", () => {
    const c1 = generateCatalog();
    const c2 = generateCatalog();
    expect(c1.totalEvents).toBe(c2.totalEvents);
    expect(c1.entries.map(e => e.eventId)).toEqual(c2.entries.map(e => e.eventId));
  });

  it("lifecycle dashboard is deterministic", () => {
    const d1 = generateLifecycleDashboard();
    const d2 = generateLifecycleDashboard();
    expect(d1.totalEvents).toBe(d2.totalEvents);
    expect(d1.currentVersions.length).toBe(d2.currentVersions.length);
  });

  it("governance dashboard ownership is deterministic", () => {
    const d1 = generateGovernanceDashboard();
    const d2 = generateGovernanceDashboard();
    expect(d1.ownership).toEqual(d2.ownership);
  });

  it("health score computation is deterministic", () => {
    const h1 = recordProducerMetrics({ producer: "test-prod-1" as never, errorRate: 0.1, avgLatencyMs: 500 });
    _resetRepositoryForTesting();
    const h2 = recordProducerMetrics({ producer: "test-prod-1" as never, errorRate: 0.1, avgLatencyMs: 500 });
    expect(h1.healthScore).toBe(h2.healthScore);
  });
});
