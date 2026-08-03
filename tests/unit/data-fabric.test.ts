/** EduBek — Phase 5B.3 Data Fabric tests. */
import { describe, it, expect } from "vitest";
import {
  registerEntity, getEntity, listEntities, updateEntityState,
  appendEvent, getEvents, reconstructState,
  listReadModels, getReadModel,
  createStreamSubscription, listStreamSubscriptions,
  syncFromNode, getSyncCheckpoints,
  indexEntity, globalSearch,
  createFederatedJob, contributeToFederatedJob, aggregateFederatedJob, listFederatedJobs,
  generateBenchmarkReport, listBenchmarks,
  recordTrace, listTraces,
  createGovernancePolicy, listGovernancePolicies, enforceRetentionPolicies,
  captureIntelligenceSnapshot, listIntelligenceSnapshots,
  getFabricOverview,
} from "@/features/data-fabric";

const TEST_ID = `test-5b3-${Date.now()}`;
const TEST_ENTITY = `test-entity-${Date.now()}`;

// ---------------------------------------------------------------------------
// Data Fabric — Entity Management
// ---------------------------------------------------------------------------

describe("Data Fabric — Entity Management", () => {
  it("registers + retrieves + lists + updates an entity", async () => {
    const entity = await registerEntity({
      entityType: "resource", entityId: TEST_ENTITY, organizationId: "test-org",
      state: { title: "Test Resource", status: "active" },
    });
    expect(entity.id).toBeTruthy();
    expect(entity.entityType).toBe("resource");
    expect(entity.entityId).toBe(TEST_ENTITY);
    expect(entity.syncStatus).toBe("in_sync");

    const retrieved = await getEntity("resource", TEST_ENTITY);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.entityId).toBe(TEST_ENTITY);

    const list = await listEntities({ entityType: "resource", limit: 10 });
    expect(list.length).toBeGreaterThan(0);

    const updated = await updateEntityState("resource", TEST_ENTITY, { title: "Updated Resource", status: "published" }, "update");
    expect(updated.state).toHaveProperty("title", "Updated Resource");
    expect(updated.lineage.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Event Sourcing
// ---------------------------------------------------------------------------

describe("Event Sourcing", () => {
  it("appends events + reconstructs state from events", async () => {
    const entityId = `event-test-${Date.now()}`;
    await registerEntity({ entityType: "resource", entityId, state: {} });

    await appendEvent({ type: "ResourceCreated", entityType: "resource", entityId, payload: { title: "My Resource", status: "draft" } });
    await appendEvent({ type: "ResourcePublished", entityType: "resource", entityId, payload: { status: "published" } });
    await appendEvent({ type: "ResourceUpdated", entityType: "resource", entityId, payload: { title: "Updated Title" } });

    const events = await getEvents({ entityType: "resource", entityId });
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0]!.type).toBe("ResourceCreated");
    expect(events[1]!.type).toBe("ResourcePublished");
    expect(events[2]!.type).toBe("ResourceUpdated");

    // Verify sequences are monotonic
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.sequence).toBeGreaterThan(events[i - 1]!.sequence);
    }

    // Reconstruct state
    const state = await reconstructState("resource", entityId);
    expect(state).toHaveProperty("title", "Updated Title");
    expect(state).toHaveProperty("status", "published");
    expect(state).toHaveProperty("_lastEvent", "ResourceUpdated");
  });
});

// ---------------------------------------------------------------------------
// CQRS — Read Models
// ---------------------------------------------------------------------------

describe("CQRS — Read Models", () => {
  it("projects read models from events + retrieves them", async () => {
    const entityId = `readmodel-test-${Date.now()}`;
    await registerEntity({ entityType: "resource", entityId, state: {} });
    await appendEvent({ type: "ResourceCreated", entityType: "resource", entityId, payload: { title: "Read Model Test" } });

    // Read models should be auto-projected
    const list = await listReadModels({ entityType: "resource", entityId, limit: 10 });
    expect(list.length).toBeGreaterThan(0);

    const dashboard = await getReadModel("dashboard", "resource", entityId);
    expect(dashboard).toBeTruthy();
    expect(dashboard!.lastSequence).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Stream Subscriptions
// ---------------------------------------------------------------------------

describe("Stream Subscriptions", () => {
  it("creates + lists stream subscriptions", async () => {
    const sub = await createStreamSubscription({
      subscriberId: TEST_ID, streamType: "events",
      filter: { eventTypes: ["ResourceCreated", "QuizCompleted"] },
      deliveryMethod: "webhook", deliveryTarget: "https://example.com/stream",
    });
    expect(sub.id).toBeTruthy();
    expect(sub.status).toBe("active");
    expect(sub.streamType).toBe("events");

    const list = await listStreamSubscriptions({ subscriberId: TEST_ID });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Distributed Synchronization
// ---------------------------------------------------------------------------

describe("Distributed Synchronization", () => {
  it("syncs from a node + creates a checkpoint", async () => {
    const result = await syncFromNode({
      nodeId: `test-node-${Date.now()}`, entityType: "resource", syncMode: "delta",
    });
    expect(result.nodeId).toBeTruthy();
    expect(result.entityType).toBe("resource");
    expect(result.syncMode).toBe("delta");

    const checkpoints = await getSyncCheckpoints({ entityType: "resource", limit: 10 });
    expect(checkpoints.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Global Search Index
// ---------------------------------------------------------------------------

describe("Global Search Index", () => {
  it("indexes an entity + searches for it", async () => {
    await indexEntity({
      entityType: "resource", entityId: `search-test-${Date.now()}`,
      searchText: "Introduction to Quantum Physics for Beginners",
      metadata: { title: "Introduction to Quantum Physics", subject: "physics" },
      popularity: 0.8, quality: 0.9, language: "en",
    });

    const result = await globalSearch({ query: "quantum physics" });
    expect(result.results.length).toBeGreaterThan(0);
    const match = result.results.find((r) => r.metadata.title === "Introduction to Quantum Physics");
    expect(match).toBeTruthy();
    expect(match!.score).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Federated Learning
// ---------------------------------------------------------------------------

describe("Federated Learning", () => {
  it("creates a job + contributes + aggregates parameters", async () => {
    const job = await createFederatedJob({
      type: "model_training", modelType: "recommendation",
      participants: [
        { orgId: "org-a", contributed: false },
        { orgId: "org-b", contributed: false },
      ],
    });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("pending");
    expect(job.participants.length).toBe(2);

    // Contribute from org-a
    await contributeToFederatedJob(job.id, "org-a", { weight1: 0.5, weight2: 0.3 }, 0.8);
    // Contribute from org-b
    const running = await contributeToFederatedJob(job.id, "org-b", { weight1: 0.7, weight2: 0.4 }, 0.9);
    expect(running.status).toBe("running");

    // Aggregate
    const aggregated = await aggregateFederatedJob(job.id);
    expect(aggregated.status).toBe("completed");
    expect(aggregated.round).toBe(1);
    expect(Object.keys(aggregated.aggregatedParams).length).toBeGreaterThan(0);

    const list = await listFederatedJobs({ modelType: "recommendation" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Cross-Institution Benchmarking
// ---------------------------------------------------------------------------

describe("Cross-Institution Benchmarking", () => {
  it("generates + lists a benchmark report", async () => {
    const report = await generateBenchmarkReport({
      organizationId: `bench-org-${Date.now()}`, period: "monthly",
    });
    expect(report.id).toBeTruthy();
    expect(report.period).toBe("monthly");
    expect(report.metrics).toBeTruthy();
    expect(report.comparison).toBeTruthy();
    expect(report.aiSummary).toBeTruthy();

    const list = await listBenchmarks({ limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Unified Observability
// ---------------------------------------------------------------------------

describe("Unified Observability", () => {
  it("records + lists traces", async () => {
    const trace = await recordTrace({
      traceType: "api", correlationId: `trace-${Date.now()}`,
      operation: "GET /api/resources", status: "success", durationMs: 42,
      spans: [{ spanId: "span-1", name: "db_query", startMs: 0, durationMs: 20, status: "success" }],
      metrics: { cpuUsage: 15, memoryUsage: 64, requestCount: 1, errorCount: 0 },
      logs: [{ timestamp: new Date().toISOString(), level: "info", message: "Request processed" }],
      dependencies: [{ from: "api", to: "db", type: "database", latency: 20 }],
    });
    expect(trace.id).toBeTruthy();
    expect(trace.status).toBe("success");
    expect(trace.spans.length).toBe(1);

    const list = await listTraces({ traceType: "api", limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Data Governance
// ---------------------------------------------------------------------------

describe("Data Governance", () => {
  it("creates + lists governance policies", async () => {
    const policy = await createGovernancePolicy({
      type: "retention", name: `Test Retention ${Date.now()}`,
      description: "Retain events for 90 days",
      retentionDays: 90, region: "eu",
      rules: [{ field: "entityType", operator: "equals", value: "resource", action: "archive" }],
    });
    expect(policy.id).toBeTruthy();
    expect(policy.type).toBe("retention");
    expect(policy.retentionDays).toBe(90);
    expect(policy.enabled).toBe(true);

    const list = await listGovernancePolicies({ type: "retention" });
    expect(list.length).toBeGreaterThan(0);
  });

  it("enforces retention policies without errors", async () => {
    const result = await enforceRetentionPolicies();
    expect(result).toHaveProperty("entitiesArchived");
    expect(result).toHaveProperty("eventsDeleted");
  });
});

// ---------------------------------------------------------------------------
// Intelligence Lake
// ---------------------------------------------------------------------------

describe("Intelligence Lake", () => {
  it("captures + lists intelligence snapshots", async () => {
    const snapshot = await captureIntelligenceSnapshot({
      type: "trend_analysis", organizationId: "test-org",
      data: { metrics: { mastery: 0.7, engagement: 0.8 } },
    });
    expect(snapshot.id).toBeTruthy();
    expect(snapshot.type).toBe("trend_analysis");
    expect(snapshot.insights.length).toBeGreaterThan(0);
    expect(snapshot.forecasts.length).toBeGreaterThan(0);
    expect(snapshot.trends.length).toBeGreaterThan(0);

    const list = await listIntelligenceSnapshots({ type: "trend_analysis" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Fabric Overview
// ---------------------------------------------------------------------------

describe("Fabric Overview", () => {
  it("returns comprehensive overview with all metrics", async () => {
    const overview = await getFabricOverview();
    expect(overview.totalEntities).toBeGreaterThanOrEqual(0);
    expect(overview.totalEvents).toBeGreaterThanOrEqual(0);
    expect(overview.totalReadModels).toBeGreaterThanOrEqual(0);
    expect(overview.syncStatus).toHaveProperty("inSync");
    expect(overview.syncStatus).toHaveProperty("conflict");
    expect(typeof overview.searchIndexSize).toBe("number");
    expect(typeof overview.activeStreams).toBe("number");
    expect(typeof overview.governancePolicies).toBe("number");
    expect(typeof overview.platformHealth).toBe("number");
  });
});
