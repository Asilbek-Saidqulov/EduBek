/**
 * EduBek — Cloud Infrastructure service.
 *
 * Phase 5C.1: Distributed Task Engine, AI Inference Gateway,
 * Workflow Scheduler, Resource Manager, Cache Layer, Media/Document
 * Pipelines, Secrets Management, Infrastructure Observability,
 * Cloud Operations Center.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { env } from "@/config/env";
import * as crypto from "node:crypto";
import * as repo from "./repository";
import type {
  CacheEntryDto, CloudJobDto, CloudOperationsCenterDto, CloudWorkerDto,
  CostSnapshotDto, DocumentJobDto, InfraMetricDto, InferenceRequestDto,
  MediaJobDto, ResourceAllocationDto, ScheduledWorkflowDto, SecretDto,
} from "./types";

const log = getLogger("cloud-infra");
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// 1. Distributed Task Engine
// ===========================================================================

export async function submitJob(input: {
  type: string; queue?: string; priority?: number; payload?: Record<string, unknown>;
  maxRetries?: number; timeoutMs?: number; scheduledFor?: Date;
  requirements?: Record<string, unknown>; organizationId?: string; createdBy?: string;
}): Promise<CloudJobDto> {
  const row = await repo.createJob({
    type: input.type, queue: input.queue ?? "default", priority: input.priority ?? 5,
    payload: JSON.stringify(input.payload ?? {}), status: "queued",
    maxRetries: input.maxRetries ?? 3, retryDelayMs: 5000,
    scheduledFor: input.scheduledFor, timeoutMs: input.timeoutMs ?? 300000,
    requirements: JSON.stringify(input.requirements ?? {}),
    organizationId: input.organizationId, createdBy: input.createdBy,
  });
  log.info("job.submitted", { id: row.id, type: input.type, queue: input.queue ?? "default" });
  return mapJob(row);
}

export async function getJob(id: string): Promise<CloudJobDto | null> {
  const row = await repo.findJob(id);
  return row ? mapJob(row) : null;
}

export async function listJobs(input: { type?: string; queue?: string; status?: string; organizationId?: string; limit?: number }): Promise<CloudJobDto[]> {
  const rows = await repo.findJobs(input);
  return rows.map(mapJob);
}

export async function processNextJob(queue: string): Promise<CloudJobDto | null> {
  const jobs = await repo.findQueuedJobs(queue, 1);
  if (jobs.length === 0) return null;
  const job = jobs[0]!;
  await repo.updateJob(job.id, { status: "running", startedAt: new Date() });

  try {
    // Simulate job execution
    await new Promise((r) => setTimeout(r, Math.random() * 50));
    const result = { processed: true, type: job.type, duration: Math.random() * 1000 };
    const updated = await repo.updateJob(job.id, {
      status: "completed", progress: 100, result: JSON.stringify(result), completedAt: new Date(),
    });
    log.info("job.completed", { id: job.id, type: job.type });
    return mapJob(updated);
  } catch (err) {
    const retryCount = job.retryCount + 1;
    const shouldRetry = retryCount < job.maxRetries;
    const updated = await repo.updateJob(job.id, {
      status: shouldRetry ? "queued" : "dead_letter",
      retryCount, errorMessage: (err as Error).message,
      scheduledFor: shouldRetry ? new Date(Date.now() + job.retryDelayMs) : undefined,
    });
    log.warn("job.failed", { id: job.id, retryCount, willRetry: shouldRetry });
    return mapJob(updated);
  }
}

export async function cancelJob(id: string): Promise<CloudJobDto> {
  const row = await repo.updateJob(id, { status: "cancelled", completedAt: new Date() });
  return mapJob(row);
}

export async function retryJob(id: string): Promise<CloudJobDto> {
  const job = await repo.findJob(id);
  if (!job) throw new Error("Job not found");
  const row = await repo.updateJob(id, {
    status: "queued", retryCount: 0, errorMessage: null,
    scheduledFor: new Date(),
  });
  return mapJob(row);
}

export async function processQueue(queue: string, batchSize = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
  let processed = 0, succeeded = 0, failed = 0;
  for (let i = 0; i < batchSize; i++) {
    const result = await processNextJob(queue);
    if (!result) break;
    processed += 1;
    if (result.status === "completed") succeeded += 1;
    else if (result.status === "dead_letter") failed += 1;
  }
  return { processed, succeeded, failed };
}

// ===========================================================================
// 2. AI Inference Gateway
// ===========================================================================

const PROVIDER_PRIORITY: Record<string, number> = {
  gemini: 1, openai: 2, anthropic: 3, groq: 4, deepseek: 5, mistral: 6, local: 7, edubek: 8,
};

export async function requestInference(input: {
  provider?: string; model?: string; requestType?: string;
  input: Record<string, unknown>; organizationId?: string; userId?: string;
}): Promise<InferenceRequestDto> {
  const provider = (input.provider ?? "edubek") as string;
  const model = input.model ?? "default";
  const requestType = input.requestType ?? "chat";

  const row = await repo.createInference({
    provider, model, requestType, input: JSON.stringify(input.input),
    status: "running", organizationId: input.organizationId, userId: input.userId,
  });

  try {
    // Simulate inference (real implementation would call the provider API)
    await new Promise((r) => setTimeout(r, Math.random() * 100));
    const output = { response: "Inference completed", provider, model };
    const costCredits = Math.ceil(Math.random() * 10) + 1;
    const latencyMs = Math.ceil(Math.random() * 500) + 50;
    const tokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };

    const updated = await repo.updateInference(row.id, {
      status: "completed", output: JSON.stringify(output),
      costCredits, latencyMs, tokenUsage: JSON.stringify(tokenUsage),
    });
    log.info("inference.completed", { id: row.id, provider, latencyMs, costCredits });
    return mapInference(updated);
  } catch (err) {
    // Try fallback to next provider
    const fallbackProvider = findFallbackProvider(provider);
    if (fallbackProvider) {
      const updated = await repo.updateInference(row.id, {
        status: "fallback", fallbackProvider, fallbackReason: (err as Error).message,
        output: JSON.stringify({ response: "Fallback inference", provider: fallbackProvider }),
        costCredits: 5, latencyMs: 200,
      });
      log.warn("inference.fallback", { id: row.id, from: provider, to: fallbackProvider });
      return mapInference(updated);
    }
    const updated = await repo.updateInference(row.id, { status: "failed", errorMessage: (err as Error).message });
    return mapInference(updated);
  }
}

function findFallbackProvider(currentProvider: string): string | null {
  const currentPriority = PROVIDER_PRIORITY[currentProvider] ?? 99;
  for (const [provider, priority] of Object.entries(PROVIDER_PRIORITY)) {
    if (priority > currentPriority) return provider;
  }
  return null;
}

export async function listInferences(input: { provider?: string; status?: string; organizationId?: string; userId?: string; limit?: number }): Promise<InferenceRequestDto[]> {
  const rows = await repo.findInferences(input);
  return rows.map(mapInference);
}

export async function getInference(id: string): Promise<InferenceRequestDto | null> {
  const row = await repo.findInference(id);
  return row ? mapInference(row) : null;
}

// ===========================================================================
// 3. Distributed Workflow Scheduler
// ===========================================================================

export async function createScheduledWorkflow(input: {
  name: string; description?: string;
  scheduleType: "nightly" | "weekly" | "semester" | "cron" | "delayed" | "recurring";
  cronExpression?: string; workflowType: string; workflowParams?: Record<string, unknown>;
  dependencies?: Array<{ jobId: string; dependsOn: string[] }>;
  organizationId?: string; createdBy: string;
}): Promise<ScheduledWorkflowDto> {
  const nextRunAt = computeNextRun(input.scheduleType, input.cronExpression);
  const row = await repo.createScheduledWorkflow({
    name: input.name, description: input.description, scheduleType: input.scheduleType,
    cronExpression: input.cronExpression, workflowType: input.workflowType,
    workflowParams: JSON.stringify(input.workflowParams ?? {}),
    dependencies: JSON.stringify(input.dependencies ?? []),
    status: "active", nextRunAt, organizationId: input.organizationId, createdBy: input.createdBy,
  });
  log.info("workflow.scheduled", { id: row.id, name: input.name, scheduleType: input.scheduleType, nextRunAt });
  return mapWorkflow(row);
}

export async function listScheduledWorkflows(input: { status?: string; organizationId?: string; scheduleType?: string; limit?: number }): Promise<ScheduledWorkflowDto[]> {
  const rows = await repo.findScheduledWorkflows(input);
  return rows.map(mapWorkflow);
}

export async function pauseScheduledWorkflow(id: string): Promise<ScheduledWorkflowDto> {
  const row = await repo.updateScheduledWorkflow(id, { status: "paused" });
  return mapWorkflow(row);
}

export async function resumeScheduledWorkflow(id: string): Promise<ScheduledWorkflowDto> {
  const row = await repo.updateScheduledWorkflow(id, { status: "active", nextRunAt: new Date(Date.now() + 60_000) });
  return mapWorkflow(row);
}

export async function executeDueWorkflows(): Promise<{ executed: number; succeeded: number; failed: number }> {
  const due = await repo.findDueWorkflows();
  let executed = 0, succeeded = 0, failed = 0;

  for (const workflow of due) {
    executed += 1;
    try {
      // Submit the workflow as a cloud job
      await submitJob({
        type: "custom", queue: "default", priority: 3,
        payload: { workflowType: workflow.workflowType, params: safeParse(workflow.workflowParams, {}) },
        organizationId: workflow.organizationId ?? undefined, createdBy: workflow.createdBy,
      });

      const nextRun = computeNextRun(workflow.scheduleType, workflow.cronExpression ?? undefined);
      await repo.updateScheduledWorkflow(workflow.id, {
        lastExecutedAt: new Date(), lastExecutionStatus: "completed", nextRunAt: nextRun,
      });
      succeeded += 1;
    } catch (err) {
      await repo.updateScheduledWorkflow(workflow.id, {
        lastExecutedAt: new Date(), lastExecutionStatus: "failed",
      });
      failed += 1;
      log.error("workflow.execution_failed", { id: workflow.id, error: (err as Error).message });
    }
  }

  log.info("scheduler.executed_due", { executed, succeeded, failed });
  return { executed, succeeded, failed };
}

function computeNextRun(scheduleType: string, cronExpression?: string): Date {
  const now = new Date();
  switch (scheduleType) {
    case "nightly": return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "weekly": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "semester": return new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
    case "recurring": return new Date(now.getTime() + 60 * 60 * 1000); // hourly
    case "delayed": return new Date(now.getTime() + 5 * 60 * 1000); // 5 min
    case "cron": return new Date(now.getTime() + 60 * 60 * 1000); // simplified — real cron parsing would be here
    default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

// ===========================================================================
// 4. Resource Manager
// ===========================================================================

export async function allocateResource(input: {
  resourceType: string; allocatedTo: string; allocatedToType: string;
  amount: number; unit?: string; organizationId?: string;
}): Promise<ResourceAllocationDto> {
  const row = await repo.createAllocation({
    resourceType: input.resourceType, allocatedTo: input.allocatedTo,
    allocatedToType: input.allocatedToType, amount: input.amount,
    unit: input.unit ?? "cores", organizationId: input.organizationId, status: "active",
  });
  return mapAllocation(row);
}

export async function releaseResource(id: string): Promise<void> {
  await repo.updateAllocation(id, { status: "released", releasedAt: new Date() });
}

export async function listAllocations(input: { resourceType?: string; allocatedTo?: string; status?: string; organizationId?: string; limit?: number }): Promise<ResourceAllocationDto[]> {
  const rows = await repo.findAllocations(input);
  return rows.map(mapAllocation);
}

// ===========================================================================
// 5. Distributed Cache Layer
// ===========================================================================

export async function cacheSet(input: {
  namespace: string; key: string; value: Record<string, unknown>;
  ttlSeconds?: number; tags?: string[];
}): Promise<void> {
  const expiresAt = new Date(Date.now() + (input.ttlSeconds ?? 300) * 1000);
  await repo.upsertCache({
    namespace: input.namespace, key: input.key,
    value: JSON.stringify(input.value), ttlSeconds: input.ttlSeconds ?? 300,
    compression: "none", tags: JSON.stringify(input.tags ?? []),
    expiresAt, hitCount: 0, missCount: 0,
  });
}

export async function cacheGet(namespace: string, key: string): Promise<Record<string, unknown> | null> {
  const entry = await repo.findCache(namespace, key);
  if (!entry) return null;
  if (entry.expiresAt < new Date()) {
    await repo.deleteCache(namespace, key).catch(() => undefined);
    return null;
  }
  // Update hit count + last accessed
  await db.cacheEntry.update({
    where: { id: entry.id },
    data: { hitCount: { increment: 1 }, lastAccessedAt: new Date() },
  }).catch(() => undefined);
  return safeParse(entry.value, {});
}

export async function cacheDelete(namespace: string, key: string): Promise<void> {
  await repo.deleteCache(namespace, key).catch(() => undefined);
}

export async function cacheStats(): Promise<{ totalEntries: number; totalHits: number; totalMisses: number; hitRate: number }> {
  const [totalEntries, { hits, misses }] = await Promise.all([
    repo.countCache(),
    repo.countCacheHits(),
  ]);
  const total = hits + misses;
  return { totalEntries, totalHits: hits, totalMisses: misses, hitRate: total > 0 ? hits / total : 0 };
}

export async function warmCache(namespace: string, entries: Array<{ key: string; value: Record<string, unknown>; ttlSeconds?: number }>): Promise<number> {
  for (const entry of entries) {
    await cacheSet({ namespace, key: entry.key, value: entry.value, ttlSeconds: entry.ttlSeconds });
  }
  return entries.length;
}

export async function invalidateByTags(tags: string[]): Promise<number> {
  // SQLite doesn't support array operations — fetch + filter
  const allEntries = await db.cacheEntry.findMany({ select: { id: true, namespace: true, key: true, tags: true } });
  let count = 0;
  for (const entry of allEntries) {
    const entryTags = safeParse<string[]>(entry.tags, []);
    if (entryTags.some((t) => tags.includes(t))) {
      await repo.deleteCache(entry.namespace, entry.key).catch(() => undefined);
      count += 1;
    }
  }
  return count;
}

// ===========================================================================
// 6. Media Processing Pipeline
// ===========================================================================

export async function submitMediaJob(input: {
  mediaType: string; operation: string; inputUrl: string;
  organizationId?: string;
}): Promise<MediaJobDto> {
  const cloudJob = await submitJob({
    type: "media_processing", queue: "media", priority: 5,
    payload: { mediaType: input.mediaType, operation: input.operation, inputUrl: input.inputUrl },
    organizationId: input.organizationId,
  });
  const row = await repo.createMediaJob({
    mediaType: input.mediaType, operation: input.operation, inputUrl: input.inputUrl,
    status: "queued", cloudJobId: cloudJob.id, organizationId: input.organizationId,
  });
  log.info("media_job.submitted", { id: row.id, operation: input.operation, mediaType: input.mediaType });
  return mapMediaJob(row);
}

export async function getMediaJob(id: string): Promise<MediaJobDto | null> {
  const row = await repo.findMediaJob(id);
  return row ? mapMediaJob(row) : null;
}

export async function listMediaJobs(input: { status?: string; mediaType?: string; organizationId?: string; limit?: number }): Promise<MediaJobDto[]> {
  const rows = await repo.findMediaJobs(input);
  return rows.map(mapMediaJob);
}

export async function completeMediaJob(id: string, outputUrl: string, metadata: Record<string, unknown>): Promise<MediaJobDto> {
  const row = await repo.updateMediaJob(id, {
    status: "completed", progress: 100, outputUrl,
    metadata: JSON.stringify(metadata),
  });
  return mapMediaJob(row);
}

// ===========================================================================
// 7. Document Intelligence Pipeline
// ===========================================================================

export async function submitDocumentJob(input: {
  documentType: string; inputUrl: string; organizationId?: string;
}): Promise<DocumentJobDto> {
  const cloudJob = await submitJob({
    type: "document_processing", queue: "documents", priority: 5,
    payload: { documentType: input.documentType, inputUrl: input.inputUrl },
    organizationId: input.organizationId,
  });
  const row = await repo.createDocumentJob({
    documentType: input.documentType, inputUrl: input.inputUrl,
    status: "queued", cloudJobId: cloudJob.id, organizationId: input.organizationId,
  });
  log.info("document_job.submitted", { id: row.id, documentType: input.documentType });
  return mapDocumentJob(row);
}

export async function getDocumentJob(id: string): Promise<DocumentJobDto | null> {
  const row = await repo.findDocumentJob(id);
  return row ? mapDocumentJob(row) : null;
}

export async function listDocumentJobs(input: { status?: string; documentType?: string; organizationId?: string; limit?: number }): Promise<DocumentJobDto[]> {
  const rows = await repo.findDocumentJobs(input);
  return rows.map(mapDocumentJob);
}

export async function completeDocumentJob(id: string, extractedContent: Record<string, unknown>, pageCount: number): Promise<DocumentJobDto> {
  const row = await repo.updateDocumentJob(id, {
    status: "completed", progress: 100,
    extractedContent: JSON.stringify(extractedContent), pageCount,
  });
  return mapDocumentJob(row);
}

// ===========================================================================
// 8. Secrets Management
// ===========================================================================

const ENCRYPTION_KEY = env.auth.encryptionKey;

export async function storeSecret(input: {
  type: string; name: string; value: string;
  organizationId?: string; rotationEnabled?: boolean; rotationDays?: number;
  createdBy: string;
}): Promise<SecretDto> {
  const encrypted = encrypt(input.value);
  const nextRotationAt = input.rotationEnabled && input.rotationDays
    ? new Date(Date.now() + input.rotationDays * 24 * 60 * 60 * 1000)
    : undefined;
  const row = await repo.createSecret({
    type: input.type, name: input.name, encryptedValue: encrypted,
    organizationId: input.organizationId,
    rotationEnabled: input.rotationEnabled ?? false, rotationDays: input.rotationDays,
    nextRotationAt, createdBy: input.createdBy,
  });
  log.info("secret.stored", { id: row.id, type: input.type, name: input.name });
  return mapSecret(row);
}

export async function getSecretValue(id: string, accessedBy: string): Promise<string | null> {
  const row = await repo.findSecret(id);
  if (!row) return null;
  await repo.updateSecret(id, { lastAccessedBy: accessedBy, lastAccessedAt: new Date() });
  return decrypt(row.encryptedValue);
}

export async function listSecrets(input: { type?: string; organizationId?: string; limit?: number }): Promise<SecretDto[]> {
  const rows = await repo.findSecrets(input);
  return rows.map(mapSecret);
}

export async function rotateSecret(id: string, newValue: string): Promise<SecretDto> {
  const encrypted = encrypt(newValue);
  const row = await repo.findSecret(id);
  const nextRotationAt = row?.rotationDays
    ? new Date(Date.now() + row.rotationDays * 24 * 60 * 60 * 1000)
    : undefined;
  const updated = await repo.updateSecret(id, {
    encryptedValue: encrypted, lastRotatedAt: new Date(), nextRotationAt,
  });
  log.info("secret.rotated", { id });
  return mapSecret(updated);
}

export async function findSecretsDueForRotation(): Promise<SecretDto[]> {
  const rows = await repo.findSecretsDueForRotation();
  return rows.map(mapSecret);
}

/**
 * Encrypt a secret using AES-256-GCM with a fresh random IV per call.
 *
 * The encrypted blob is `iv:tag:ciphertext` (all hex), which:
 *   - Uses a unique IV per encryption (prevents CBC-style pattern leakage)
 *   - Includes an authentication tag (detects tampering)
 *   - Uses the platform-wide EDUBEK_ENCRYPTION_KEY (32 bytes, validated at boot)
 *
 * The previous implementation used AES-256-CBC with a static zero IV, which
 * catastrophically leaked plaintext patterns. This implementation is safe
 * for at-rest storage of OAuth client secrets, payment provider keys, etc.
 *
 * NOTE: existing secrets encrypted with the old scheme cannot be decrypted
 * with the new one — a migration script is needed to re-encrypt legacy
 * values. For new deployments (fresh DB), this is fine.
 */
function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "utf8");
  const keyBuf = key.length >= 32 ? key.subarray(0, 32) : (() => {
    const padded = Buffer.alloc(32);
    key.copy(padded);
    return padded;
  })();
  return encryptWithKey(text, keyBuf);
}

function encryptWithKey(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(12); // 96-bit IV is recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format (expected iv:tag:ciphertext)");
  }
  const [ivHex, tagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const key = Buffer.from(ENCRYPTION_KEY, "utf8");
  const keyBuf = key.length >= 32 ? key.subarray(0, 32) : (() => {
    const padded = Buffer.alloc(32);
    key.copy(padded);
    return padded;
  })();
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuf, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ===========================================================================
// 9. Infrastructure Observability
// ===========================================================================

export async function recordMetric(input: {
  source: string; metric: string; value: number; unit?: string;
  labels?: Record<string, unknown>;
}): Promise<InfraMetricDto> {
  const row = await repo.createMetric({
    source: input.source, metric: input.metric, value: input.value,
    unit: input.unit ?? "count", labels: JSON.stringify(input.labels ?? {}),
  });
  return mapMetric(row);
}

export async function listMetrics(input: { source?: string; metric?: string; limit?: number }): Promise<InfraMetricDto[]> {
  const rows = await repo.findMetrics(input);
  return rows.map(mapMetric);
}

export async function getLatestMetric(source: string, metric: string): Promise<InfraMetricDto | null> {
  const row = await repo.findLatestMetric(source, metric);
  return row ? mapMetric(row) : null;
}

// ===========================================================================
// 10. Cloud Workers
// ===========================================================================

export async function registerWorker(input: {
  type: string; name: string; capabilities?: string[];
  resources?: Record<string, unknown>;
}): Promise<CloudWorkerDto> {
  const row = await repo.createWorker({
    type: input.type, name: input.name, status: "idle",
    capabilities: JSON.stringify(input.capabilities ?? []),
    resources: JSON.stringify(input.resources ?? {}),
    currentLoad: JSON.stringify({ cpuUsage: 0, memoryUsage: 0, activeJobs: 0 }),
  });
  log.info("worker.registered", { id: row.id, type: input.type, name: input.name });
  return mapWorker(row);
}

export async function listWorkers(input: { type?: string; status?: string; limit?: number }): Promise<CloudWorkerDto[]> {
  const rows = await repo.findWorkers(input);
  return rows.map(mapWorker);
}

export async function heartbeat(workerId: string, load: Record<string, unknown>): Promise<void> {
  await repo.updateWorker(workerId, {
    lastHeartbeatAt: new Date(),
    currentLoad: JSON.stringify(load),
    status: (load.activeJobs as number) > 0 ? "busy" : "idle",
    uptimeSeconds: { increment: 60 },
  });
}

// ===========================================================================
// 11. Cost Tracking
// ===========================================================================

export async function recordCostSnapshot(input: {
  organizationId?: string;
  breakdown?: Record<string, number>;
  totalCredits?: number;
  estimatedUsd?: number;
  byService?: Array<{ service: string; credits: number; usd: number }>;
}): Promise<CostSnapshotDto> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const row = await repo.createCostSnapshot({
    day: today, organizationId: input.organizationId,
    breakdown: JSON.stringify(input.breakdown ?? {}),
    totalCredits: input.totalCredits ?? 0,
    estimatedUsd: input.estimatedUsd ?? 0,
    byService: JSON.stringify(input.byService ?? []),
  });
  return mapCost(row);
}

export async function listCostSnapshots(input: { organizationId?: string; limit?: number }): Promise<CostSnapshotDto[]> {
  const rows = await repo.findCostSnapshots(input);
  return rows.map(mapCost);
}

// ===========================================================================
// 12. Cloud Operations Center
// ===========================================================================

export async function getOperationsCenter(organizationId?: string): Promise<CloudOperationsCenterDto> {
  const [queued, running, completed, failed, deadLetter, cacheStatsResult, workers, costs] = await Promise.all([
    repo.countJobsByStatus("queued"),
    repo.countJobsByStatus("running"),
    repo.countJobsByStatus("completed"),
    repo.countJobsByStatus("failed"),
    repo.countJobsByStatus("dead_letter"),
    cacheStats(),
    repo.findWorkers({ limit: 1000 }),
    repo.findLatestCost(organizationId),
  ]);

  const idleWorkers = workers.filter((w: any) => w.status === "idle").length;
  const busyWorkers = workers.filter((w: any) => w.status === "busy").length;
  const offlineWorkers = workers.filter((w: any) => w.status === "offline").length;

  // Fetch AI provider stats
  const providers = ["gemini", "openai", "anthropic", "groq", "deepseek", "mistral", "local", "edubek"];
  const aiProviders = await Promise.all(providers.map(async (p) => {
    const count = await repo.countInferencesByProvider(p);
    return { provider: p, status: "active", avgLatencyMs: 200, totalRequests: count };
  }));

  // Queue stats
  const queues = [
    { name: "high_priority", depth: await repo.countJobsByQueue("high_priority"), processing: running, completed, failed },
    { name: "default", depth: await repo.countJobsByQueue("default"), processing: 0, completed: 0, failed: 0 },
    { name: "low_priority", depth: await repo.countJobsByQueue("low_priority"), processing: 0, completed: 0, failed: 0 },
    { name: "ai", depth: await repo.countJobsByQueue("ai"), processing: 0, completed: 0, failed: 0 },
    { name: "media", depth: await repo.countJobsByQueue("media"), processing: 0, completed: 0, failed: 0 },
    { name: "documents", depth: await repo.countJobsByQueue("documents"), processing: 0, completed: 0, failed: 0 },
  ];

  // Active workflows
  const activeWorkflows = await repo.findScheduledWorkflows({ status: "active", limit: 1000 }).then((w: any[]) => w.length);

  // Cluster health
  const clusterScore = Math.min(1, (completed / Math.max(1, completed + failed)) * 0.5 + (idleWorkers / Math.max(1, workers.length)) * 0.3 + cacheStatsResult.hitRate * 0.2);
  const clusterStatus = clusterScore > 0.7 ? "healthy" : clusterScore > 0.4 ? "degraded" : "down";

  return {
    clusterHealth: { status: clusterStatus as any, score: clusterScore },
    queues,
    workers: { total: workers.length, idle: idleWorkers, busy: busyWorkers, offline: offlineWorkers },
    aiProviders,
    cache: { totalEntries: cacheStatsResult.totalEntries, hitRate: cacheStatsResult.hitRate, totalHits: cacheStatsResult.totalHits, totalMisses: cacheStatsResult.totalMisses },
    storage: { usedMb: 0, quotaMb: 10240 },
    costs: { todayCredits: costs?.totalCredits ?? 0, monthCredits: (costs?.totalCredits ?? 0) * 30, estimatedUsd: costs?.estimatedUsd ?? 0 },
    activeWorkflows,
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Mappers
// ===========================================================================

function mapJob(row: any): CloudJobDto {
  return {
    id: row.id, type: row.type, queue: row.queue, priority: row.priority,
    payload: safeParse(row.payload, {}), status: row.status, workerId: row.workerId,
    progress: row.progress, result: safeParse(row.result, null),
    errorMessage: row.errorMessage, errorStack: row.errorStack,
    maxRetries: row.maxRetries, retryCount: row.retryCount, retryDelayMs: row.retryDelayMs,
    scheduledFor: row.scheduledFor?.toISOString() ?? null, timeoutMs: row.timeoutMs,
    requirements: safeParse(row.requirements, {}),
    organizationId: row.organizationId, createdBy: row.createdBy,
    startedAt: row.startedAt?.toISOString() ?? null, completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapInference(row: any): InferenceRequestDto {
  return {
    id: row.id, provider: row.provider, model: row.model, requestType: row.requestType,
    input: safeParse(row.input, {}), output: safeParse(row.output, null),
    status: row.status, fallbackProvider: row.fallbackProvider, fallbackReason: row.fallbackReason,
    costCredits: row.costCredits, latencyMs: row.latencyMs,
    tokenUsage: safeParse(row.tokenUsage, {}),
    organizationId: row.organizationId, userId: row.userId, occurredAt: row.occurredAt.toISOString(),
  };
}

function mapWorkflow(row: any): ScheduledWorkflowDto {
  return {
    id: row.id, name: row.name, description: row.description, scheduleType: row.scheduleType,
    cronExpression: row.cronExpression, workflowType: row.workflowType,
    workflowParams: safeParse(row.workflowParams, {}),
    dependencies: safeParse(row.dependencies, []),
    status: row.status, lastExecutedAt: row.lastExecutedAt?.toISOString() ?? null,
    lastExecutionStatus: row.lastExecutionStatus, nextRunAt: row.nextRunAt?.toISOString() ?? null,
    organizationId: row.organizationId, createdBy: row.createdBy,
  };
}

function mapAllocation(row: any): ResourceAllocationDto {
  return {
    id: row.id, resourceType: row.resourceType, allocatedTo: row.allocatedTo,
    allocatedToType: row.allocatedToType, amount: row.amount, unit: row.unit,
    organizationId: row.organizationId, status: row.status,
    allocatedAt: row.allocatedAt.toISOString(), releasedAt: row.releasedAt?.toISOString() ?? null,
  };
}

function mapMediaJob(row: any): MediaJobDto {
  return {
    id: row.id, mediaType: row.mediaType, operation: row.operation,
    inputUrl: row.inputUrl, outputUrl: row.outputUrl, status: row.status,
    progress: row.progress, metadata: safeParse(row.metadata, {}),
    errorMessage: row.errorMessage, organizationId: row.organizationId, cloudJobId: row.cloudJobId,
  };
}

function mapDocumentJob(row: any): DocumentJobDto {
  return {
    id: row.id, documentType: row.documentType, inputUrl: row.inputUrl,
    extractedContent: safeParse(row.extractedContent, {}),
    status: row.status, progress: row.progress, pageCount: row.pageCount,
    errorMessage: row.errorMessage, organizationId: row.organizationId, cloudJobId: row.cloudJobId,
  };
}

function mapSecret(row: any): SecretDto {
  return {
    id: row.id, type: row.type, name: row.name, organizationId: row.organizationId,
    rotationEnabled: row.rotationEnabled, rotationDays: row.rotationDays,
    lastRotatedAt: row.lastRotatedAt?.toISOString() ?? null,
    nextRotationAt: row.nextRotationAt?.toISOString() ?? null,
    createdBy: row.createdBy, lastAccessedBy: row.lastAccessedBy,
    lastAccessedAt: row.lastAccessedAt?.toISOString() ?? null,
  };
}

function mapMetric(row: any): InfraMetricDto {
  return {
    id: row.id, source: row.source, metric: row.metric, value: row.value,
    unit: row.unit, labels: safeParse(row.labels, {}), timestamp: row.timestamp.toISOString(),
  };
}

function mapWorker(row: any): CloudWorkerDto {
  return {
    id: row.id, type: row.type, name: row.name, status: row.status,
    capabilities: safeParse<string[]>(row.capabilities, []),
    resources: safeParse(row.resources, {}),
    currentLoad: safeParse(row.currentLoad, {}),
    totalJobsCompleted: row.totalJobsCompleted, totalJobsFailed: row.totalJobsFailed,
    uptimeSeconds: row.uptimeSeconds, lastHeartbeatAt: row.lastHeartbeatAt.toISOString(),
  };
}

function mapCost(row: any): CostSnapshotDto {
  return {
    id: row.id, day: row.day.toISOString(), organizationId: row.organizationId,
    breakdown: safeParse(row.breakdown, {}),
    totalCredits: row.totalCredits, estimatedUsd: row.estimatedUsd,
    byService: safeParse(row.byService, []),
  };
}
