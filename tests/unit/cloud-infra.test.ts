/** EduBek — Phase 5C.1 Cloud Infrastructure tests. */
import { describe, it, expect } from "vitest";
import {
  submitJob, getJob, listJobs, processNextJob, cancelJob, retryJob, processQueue,
  requestInference, listInferences, getInference,
  createScheduledWorkflow, listScheduledWorkflows, executeDueWorkflows,
  allocateResource, releaseResource, listAllocations,
  cacheSet, cacheGet, cacheDelete, cacheStats, warmCache,
  submitMediaJob, listMediaJobs,
  submitDocumentJob, listDocumentJobs,
  storeSecret, listSecrets, getSecretValue, rotateSecret, findSecretsDueForRotation,
  recordMetric, listMetrics,
  registerWorker, listWorkers, heartbeat,
  recordCostSnapshot, listCostSnapshots,
  getOperationsCenter,
} from "@/features/cloud-infra";

const TEST_USER = `test-5c1-${Date.now()}`;

// ---------------------------------------------------------------------------
// Distributed Task Engine
// ---------------------------------------------------------------------------

describe("Distributed Task Engine", () => {
  it("submits + retrieves + lists jobs", async () => {
    const job = await submitJob({
      type: "ai_generation", queue: "ai", priority: 3,
      payload: { prompt: "Generate a quiz" }, createdBy: TEST_USER,
    });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("queued");
    expect(job.type).toBe("ai_generation");

    const retrieved = await getJob(job.id);
    expect(retrieved).toBeTruthy();

    const list = await listJobs({ type: "ai_generation", limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });

  it("processes a job from the queue", async () => {
    const job = await submitJob({ type: "embedding", queue: "default", payload: { text: "test" } });
    const processed = await processNextJob("default");
    expect(processed).toBeTruthy();
    expect(["completed", "queued", "dead_letter"]).toContain(processed!.status);
  });

  it("cancels + retries jobs", async () => {
    const job = await submitJob({ type: "report", queue: "default" });
    const cancelled = await cancelJob(job.id);
    expect(cancelled.status).toBe("cancelled");

    const retried = await retryJob(job.id);
    expect(retried.status).toBe("queued");
  });

  it("processes a batch of jobs from a queue", async () => {
    // Submit to a unique queue to avoid interference
    const queueName = `test-queue-${Date.now()}`;
    await submitJob({ type: "notification", queue: queueName as any });
    await submitJob({ type: "notification", queue: queueName as any });
    const result = await processQueue(queueName, 5);
    expect(result.processed).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AI Inference Gateway
// ---------------------------------------------------------------------------

describe("AI Inference Gateway", () => {
  it("requests inference + retrieves result", async () => {
    const result = await requestInference({
      provider: "edubek", model: "default", requestType: "chat",
      input: { messages: [{ role: "user", content: "Hello" }] }, userId: TEST_USER,
    });
    expect(result.id).toBeTruthy();
    expect(["completed", "failed", "fallback"]).toContain(result.status);

    const retrieved = await getInference(result.id);
    expect(retrieved).toBeTruthy();
  });

  it("lists inference requests", async () => {
    const list = await listInferences({ userId: TEST_USER, limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Distributed Workflow Scheduler
// ---------------------------------------------------------------------------

describe("Distributed Workflow Scheduler", () => {
  it("creates + lists scheduled workflows", async () => {
    const wf = await createScheduledWorkflow({
      name: `Test Workflow ${Date.now()}`, scheduleType: "nightly",
      workflowType: "report_generation", workflowParams: { type: "daily" },
      createdBy: TEST_USER,
    });
    expect(wf.id).toBeTruthy();
    expect(wf.status).toBe("active");
    expect(wf.nextRunAt).toBeTruthy();

    const list = await listScheduledWorkflows({ status: "active" });
    expect(list.length).toBeGreaterThan(0);
  });

  it("executes due workflows", async () => {
    const result = await executeDueWorkflows();
    expect(result).toHaveProperty("executed");
    expect(result).toHaveProperty("succeeded");
    expect(result).toHaveProperty("failed");
  });
});

// ---------------------------------------------------------------------------
// Resource Manager
// ---------------------------------------------------------------------------

describe("Resource Manager", () => {
  it("allocates + releases resources", async () => {
    const alloc = await allocateResource({
      resourceType: "cpu", allocatedTo: "worker-1", allocatedToType: "worker",
      amount: 4, unit: "cores",
    });
    expect(alloc.id).toBeTruthy();
    expect(alloc.status).toBe("active");

    await releaseResource(alloc.id);
    const list = await listAllocations({ allocatedTo: "worker-1", status: "active" });
    expect(list.find((a) => a.id === alloc.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Distributed Cache Layer
// ---------------------------------------------------------------------------

describe("Distributed Cache Layer", () => {
  it("sets + gets + deletes cache entries", async () => {
    await cacheSet({ namespace: "ai", key: "test-key", value: { result: "cached" }, ttlSeconds: 60 });
    const value = await cacheGet("ai", "test-key");
    expect(value).toBeTruthy();
    expect(value!.result).toBe("cached");

    await cacheDelete("ai", "test-key");
    const afterDelete = await cacheGet("ai", "test-key");
    expect(afterDelete).toBeNull();
  });

  it("returns null for missing keys", async () => {
    const value = await cacheGet("ai", "nonexistent-key");
    expect(value).toBeNull();
  });

  it("returns cache stats", async () => {
    const stats = await cacheStats();
    expect(stats).toHaveProperty("totalEntries");
    expect(stats).toHaveProperty("hitRate");
    expect(stats).toHaveProperty("totalHits");
    expect(stats).toHaveProperty("totalMisses");
  });

  it("warms cache with multiple entries", async () => {
    const count = await warmCache("recommendations", [
      { key: "rec-1", value: { items: [1, 2, 3] }, ttlSeconds: 120 },
      { key: "rec-2", value: { items: [4, 5, 6] }, ttlSeconds: 120 },
    ]);
    expect(count).toBe(2);
    const v1 = await cacheGet("recommendations", "rec-1");
    expect(v1).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Media Processing Pipeline
// ---------------------------------------------------------------------------

describe("Media Processing Pipeline", () => {
  it("submits + lists media jobs", async () => {
    const job = await submitMediaJob({
      mediaType: "video", operation: "transcription", inputUrl: "https://example.com/video.mp4",
    });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("queued");

    const list = await listMediaJobs({ limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Document Intelligence Pipeline
// ---------------------------------------------------------------------------

describe("Document Intelligence Pipeline", () => {
  it("submits + lists document jobs", async () => {
    const job = await submitDocumentJob({
      documentType: "pdf", inputUrl: "https://example.com/doc.pdf",
    });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("queued");

    const list = await listDocumentJobs({ limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Secrets Management
// ---------------------------------------------------------------------------

describe("Secrets Management", () => {
  it("stores + retrieves + rotates secrets", async () => {
    const secret = await storeSecret({
      type: "api_key", name: `Test Secret ${Date.now()}`, value: "my-secret-value",
      rotationEnabled: true, rotationDays: 30, createdBy: TEST_USER,
    });
    expect(secret.id).toBeTruthy();
    expect(secret.rotationEnabled).toBe(true);

    // Retrieve value (decrypted)
    const value = await getSecretValue(secret.id, TEST_USER);
    expect(value).toBe("my-secret-value");

    // Rotate
    const rotated = await rotateSecret(secret.id, "new-secret-value");
    expect(rotated.lastRotatedAt).toBeTruthy();

    // Verify new value
    const newValue = await getSecretValue(secret.id, TEST_USER);
    expect(newValue).toBe("new-secret-value");
  });

  it("lists secrets without exposing values", async () => {
    const list = await listSecrets({ type: "api_key" });
    expect(list.length).toBeGreaterThan(0);
    // Secret DTOs should not contain the encrypted value or plain value
    expect((list[0] as any).encryptedValue).toBeUndefined();
    expect((list[0] as any).value).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Infrastructure Observability
// ---------------------------------------------------------------------------

describe("Infrastructure Observability", () => {
  it("records + lists metrics", async () => {
    const metric = await recordMetric({
      source: "worker", metric: "cpu_usage", value: 45.2, unit: "percent",
      labels: { workerId: "worker-1" },
    });
    expect(metric.id).toBeTruthy();
    expect(metric.value).toBe(45.2);

    const list = await listMetrics({ source: "worker", limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Cloud Workers
// ---------------------------------------------------------------------------

describe("Cloud Workers", () => {
  it("registers + lists workers", async () => {
    const worker = await registerWorker({
      type: "cpu", name: `Test Worker ${Date.now()}`,
      capabilities: ["ai_generation", "embedding"],
      resources: { cpuCores: 4, memoryMb: 8192 },
    });
    expect(worker.id).toBeTruthy();
    expect(worker.status).toBe("idle");
    expect(worker.capabilities).toContain("ai_generation");

    const list = await listWorkers({ type: "cpu" });
    expect(list.length).toBeGreaterThan(0);
  });

  it("receives heartbeats", async () => {
    const worker = await registerWorker({ type: "gpu", name: `GPU Worker ${Date.now()}` });
    await heartbeat(worker.id, { cpuUsage: 50, memoryUsage: 1024, activeJobs: 1 });
    const list = await listWorkers({ type: "gpu" });
    const updated = list.find((w) => w.id === worker.id);
    expect(updated!.status).toBe("busy");
  });
});

// ---------------------------------------------------------------------------
// Cost Tracking
// ---------------------------------------------------------------------------

describe("Cost Tracking", () => {
  it("records + lists cost snapshots", async () => {
    const snapshot = await recordCostSnapshot({
      breakdown: { aiInference: 50, compute: 30, storage: 20 },
      totalCredits: 100, estimatedUsd: 1.0,
      byService: [{ service: "ai", credits: 50, usd: 0.5 }, { service: "compute", credits: 30, usd: 0.3 }],
    });
    expect(snapshot.id).toBeTruthy();
    expect(snapshot.totalCredits).toBe(100);

    const list = await listCostSnapshots({ limit: 10 });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Cloud Operations Center
// ---------------------------------------------------------------------------

describe("Cloud Operations Center", () => {
  it("returns comprehensive operations dashboard", async () => {
    const dashboard = await getOperationsCenter();
    expect(dashboard.clusterHealth).toBeTruthy();
    expect(dashboard.clusterHealth.score).toBeGreaterThanOrEqual(0);
    expect(dashboard.queues.length).toBeGreaterThan(0);
    expect(dashboard.workers).toHaveProperty("total");
    expect(dashboard.workers).toHaveProperty("idle");
    expect(dashboard.workers).toHaveProperty("busy");
    expect(dashboard.aiProviders.length).toBeGreaterThan(0);
    expect(dashboard.cache).toHaveProperty("hitRate");
    expect(dashboard.costs).toHaveProperty("todayCredits");
    expect(typeof dashboard.activeWorkflows).toBe("number");
    expect(dashboard.generatedAt).toBeTruthy();
  });
});
