/** Systems 1-8: Registry, Catalog, Lake, Warehouse, ETL, ELT, Pipelines, Snapshots. */
import { randomUUID } from "node:crypto";
import {
  storeDataset, getDataset, getDatasetByKey, getAllDatasets,
  storeCatalogEntry, getCatalogEntry, getAllCatalogEntries,
  storeLakePartition, getAllLakePartitions,
  storeLakeSnapshot, getAllLakeSnapshots,
  storeLakeRetention, getLakeRetention, getAllLakeRetentions,
  storeWarehouseObject, getWarehouseObject, getAllWarehouseObjects,
  storeWarehouseRefreshLog, getWarehouseRefreshLogs,
  storeETLJob, getETLJob, getAllETLJobs,
  storeELTJob, getELTJob, getAllELTJobs,
  storePipeline, getPipeline, getAllPipelines,
  storePipelineRun, getPipelineRun, getAllPipelineRuns,
  storeSnapshot, getSnapshot, getAllSnapshots,
} from "./repository";
import type {
  DatasetDefinition, DatasetCategory, DatasetStatus,
  CatalogEntry,
  LakePartition, LakeFormat, LakeSnapshotMeta, LakeRetentionPolicy,
  WarehouseObject, WarehouseObjectType, WarehouseRefreshLog, WarehouseRefreshStatus,
  ETLJob, ETLStatus,
  ELTJob, ELTStatus,
  Pipeline, PipelineStep, PipelineStatus, PipelineRun,
  SnapshotRecord, SnapshotType, SnapshotStatus,
} from "./types";
import { publishDataEvent } from "./event-bus-bridge";

// System 1 — Dataset Registry
export function createDataset(input: { key: string; name: string; category?: DatasetCategory; ownerId: string; sourcePlatforms?: string[]; schema?: Record<string, unknown>; metadata?: Record<string, unknown> }): DatasetDefinition {
  if (getDatasetByKey(input.key)) throw new Error(`Dataset key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const d: DatasetDefinition = { id: randomUUID(), key: input.key, name: input.name, category: input.category ?? "raw", status: "draft", ownerId: input.ownerId, sourcePlatforms: input.sourcePlatforms ?? [], version: 1, schema: input.schema ?? {}, createdAt: now, updatedAt: now, archivedAt: null, metadata: input.metadata ?? {} };
  storeDataset(d);
  publishDataEvent("DatasetCreated", null, { datasetId: d.id, key: d.key, category: d.category });
  return d;
}
export function getDatasetById(id: string) { return getDataset(id); }
export function listDatasets(category?: DatasetCategory, status?: DatasetStatus) { let all = getAllDatasets(); if (category) all = all.filter(d => d.category === category); if (status) all = all.filter(d => d.status === status); return all; }
export function activateDataset(id: string) { const d = getDataset(id); if (!d) return null; d.status = "active"; d.updatedAt = new Date().toISOString(); d.version += 1; storeDataset(d); publishDataEvent("DatasetUpdated", null, { datasetId: d.id, status: "active" }); return d; }
export function archiveDataset(id: string) { const d = getDataset(id); if (!d) return null; d.status = "archived"; d.updatedAt = new Date().toISOString(); d.archivedAt = d.updatedAt; storeDataset(d); return d; }
export function supportsAllDatasetCategories(): DatasetCategory[] { return ["raw", "curated", "aggregated", "reference", "semantic", "operational", "custom"]; }
export function supportsAllDatasetStatuses(): DatasetStatus[] { return ["draft", "active", "deprecated", "archived"]; }

// System 2 — Data Catalog
export function createCatalogEntry(input: { datasetId: string; name: string; description?: string; tags?: string[]; classifications?: string[]; searchable?: boolean; owner?: string }): CatalogEntry {
  const now = new Date().toISOString();
  const c: CatalogEntry = { id: randomUUID(), datasetId: input.datasetId, name: input.name, description: input.description ?? "", tags: input.tags ?? [], classifications: input.classifications ?? [], searchable: input.searchable ?? true, owner: input.owner ?? "", createdAt: now, updatedAt: now, metadata: {} };
  storeCatalogEntry(c);
  return c;
}
export function getCatalogEntryById(id: string) { return getCatalogEntry(id); }
export function listCatalogEntries(searchable?: boolean) { const all = getAllCatalogEntries(); return searchable === undefined ? all : all.filter(c => c.searchable === searchable); }

// System 3 — Data Lake Metadata
export function createLakePartition(input: { datasetId: string; partitionKey: string; partitionValue: string; format?: LakeFormat; sizeBytes?: number; recordCount?: number }): LakePartition {
  const p: LakePartition = { id: randomUUID(), datasetId: input.datasetId, partitionKey: input.partitionKey, partitionValue: input.partitionValue, format: input.format ?? "parquet", sizeBytes: input.sizeBytes ?? 0, recordCount: input.recordCount ?? 0, createdAt: new Date().toISOString() };
  storeLakePartition(p);
  return p;
}
export function listLakePartitions() { return getAllLakePartitions(); }
export function createLakeSnapshot(input: { datasetId: string; type?: "incremental" | "full"; partitionIds?: string[]; sizeBytes?: number; retentionDays?: number }): LakeSnapshotMeta {
  const s: LakeSnapshotMeta = { id: randomUUID(), datasetId: input.datasetId, type: input.type ?? "incremental", partitionIds: input.partitionIds ?? [], sizeBytes: input.sizeBytes ?? 0, createdAt: new Date().toISOString(), retentionDays: input.retentionDays ?? 30 };
  storeLakeSnapshot(s);
  return s;
}
export function listLakeSnapshots() { return getAllLakeSnapshots(); }
export function setLakeRetention(input: { datasetId: string; retentionDays?: number; snapshotRetentionDays?: number; partitionRetentionDays?: number }): LakeRetentionPolicy {
  const existing = Array.from(getAllLakeRetentions()).find(r => r.datasetId === input.datasetId);
  const now = new Date().toISOString();
  const r: LakeRetentionPolicy = { id: existing?.id ?? randomUUID(), datasetId: input.datasetId, retentionDays: input.retentionDays ?? 365, snapshotRetentionDays: input.snapshotRetentionDays ?? 30, partitionRetentionDays: input.partitionRetentionDays ?? 90, createdAt: existing?.createdAt ?? now, updatedAt: now };
  storeLakeRetention(r);
  return r;
}
export function getLakeRetentionForDataset(datasetId: string) { return Array.from(getAllLakeRetentions()).find(r => r.datasetId === datasetId) ?? null; }
export function supportsAllLakeFormats(): LakeFormat[] { return ["parquet", "json", "csv", "avro", "orc", "delta"]; }

// System 4 — Data Warehouse Metadata
export function createWarehouseObject(input: { datasetId: string; name: string; type?: WarehouseObjectType; schema?: string; columns?: Array<{ name: string; type: string; nullable: boolean }> }): WarehouseObject {
  const now = new Date().toISOString();
  const w: WarehouseObject = { id: randomUUID(), datasetId: input.datasetId, name: input.name, type: input.type ?? "table", schema: input.schema ?? "public", columns: input.columns ?? [], version: 1, lastRefreshedAt: null, createdAt: now, updatedAt: now };
  storeWarehouseObject(w);
  return w;
}
export function getWarehouseObjectById(id: string) { return getWarehouseObject(id); }
export function listWarehouseObjects(type?: WarehouseObjectType) { const all = getAllWarehouseObjects(); return type ? all.filter(w => w.type === type) : all; }
export function recordWarehouseRefresh(input: { objectId: string; status?: WarehouseRefreshStatus; rowsAffected?: number; durationMs?: number | null; error?: string | null }): WarehouseRefreshLog {
  const l: WarehouseRefreshLog = { id: randomUUID(), objectId: input.objectId, status: input.status ?? "completed", startedAt: new Date().toISOString(), completedAt: input.status === "completed" || input.status === "failed" ? new Date().toISOString() : null, rowsAffected: input.rowsAffected ?? 0, durationMs: input.durationMs ?? null, error: input.error ?? null };
  storeWarehouseRefreshLog(l);
  if (l.status === "completed") { const w = getWarehouseObject(input.objectId); if (w) { w.lastRefreshedAt = l.completedAt; storeWarehouseObject(w); } publishDataEvent("WarehouseRefreshed", null, { objectId: input.objectId }); }
  return l;
}
export function getWarehouseRefreshHistory(objectId: string) { return getWarehouseRefreshLogs(objectId); }
export function supportsAllWarehouseObjectTypes(): WarehouseObjectType[] { return ["table", "view", "materialized_view"]; }
export function supportsAllWarehouseRefreshStatuses(): WarehouseRefreshStatus[] { return ["pending", "running", "completed", "failed"]; }

// System 5 — ETL Engine
export function createETLJob(input: { datasetId: string; name: string; sourceRef: string; transformRef: string; targetRef: string; schedule?: string | null }): ETLJob {
  const now = new Date().toISOString();
  const j: ETLJob = { id: randomUUID(), datasetId: input.datasetId, name: input.name, sourceRef: input.sourceRef, transformRef: input.transformRef, targetRef: input.targetRef, status: "pending", schedule: input.schedule ?? null, lastRunAt: null, rowsProcessed: 0, createdAt: now, updatedAt: now, metadata: {} };
  storeETLJob(j);
  return j;
}
export function getETLJobById(id: string) { return getETLJob(id); }
export function listETLJobs(status?: ETLStatus) { const all = getAllETLJobs(); return status ? all.filter(j => j.status === status) : all; }
export function runETLJob(id: string, rowsProcessed: number): ETLJob | null {
  const j = getETLJob(id); if (!j) return null;
  j.status = "completed"; j.lastRunAt = new Date().toISOString(); j.rowsProcessed = rowsProcessed; j.updatedAt = j.lastRunAt;
  storeETLJob(j);
  return j;
}
export function supportsAllETLStatuses(): ETLStatus[] { return ["pending", "extracting", "transforming", "loading", "completed", "failed"]; }

// System 6 — ELT Engine
export function createELTJob(input: { datasetId: string; name: string; sql: string; dependencies?: string[] }): ELTJob {
  const now = new Date().toISOString();
  const j: ELTJob = { id: randomUUID(), datasetId: input.datasetId, name: input.name, sql: input.sql, dependencies: input.dependencies ?? [], status: "pending", startedAt: now, completedAt: null, rowsAffected: 0, error: null, createdAt: now, updatedAt: now };
  storeELTJob(j);
  return j;
}
export function getELTJobById(id: string) { return getELTJob(id); }
export function listELTJobs(status?: ELTStatus) { const all = getAllELTJobs(); return status ? all.filter(j => j.status === status) : all; }
export function runELTJob(id: string, rowsAffected: number): ELTJob | null {
  const j = getELTJob(id); if (!j) return null;
  j.status = "completed"; j.completedAt = new Date().toISOString(); j.rowsAffected = rowsAffected; j.updatedAt = j.completedAt;
  storeELTJob(j);
  return j;
}
export function supportsAllELTStatuses(): ELTStatus[] { return ["pending", "running", "completed", "failed"]; }

// System 7 — Pipeline Orchestration
export function createPipeline(input: { name: string; datasetId?: string | null; steps?: PipelineStep[]; schedule?: string | null; maxRetries?: number }): Pipeline {
  const now = new Date().toISOString();
  const p: Pipeline = { id: randomUUID(), name: input.name, datasetId: input.datasetId ?? null, steps: input.steps ?? [], status: "pending", schedule: input.schedule ?? null, lastRunAt: null, retryCount: 0, maxRetries: input.maxRetries ?? 3, createdAt: now, updatedAt: now, metadata: {} };
  storePipeline(p);
  return p;
}
export function getPipelineById(id: string) { return getPipeline(id); }
export function listPipelines(status?: PipelineStatus) { const all = getAllPipelines(); return status ? all.filter(p => p.status === status) : all; }
export function runPipeline(id: string): PipelineRun | null {
  const p = getPipeline(id); if (!p) return null;
  const now = new Date().toISOString();
  const run: PipelineRun = { id: randomUUID(), pipelineId: id, status: "running", stepResults: p.steps.map(s => ({ stepId: s.id, status: "pending", startedAt: now, completedAt: null })), startedAt: now, completedAt: null, error: null, correlationId: randomUUID() };
  storePipelineRun(run);
  p.status = "running"; p.lastRunAt = now; p.updatedAt = now; storePipeline(p);
  return run;
}
export function completePipelineRun(runId: string): PipelineRun | null {
  const r = getPipelineRun(runId); if (!r || r.status !== "running") return null;
  r.status = "completed"; r.completedAt = new Date().toISOString();
  for (const sr of r.stepResults) { sr.status = "completed"; sr.completedAt = r.completedAt; }
  storePipelineRun(r);
  const p = getPipeline(r.pipelineId); if (p) { p.status = "completed"; p.updatedAt = r.completedAt; storePipeline(p); }
  publishDataEvent("PipelineCompleted", null, { pipelineId: r.pipelineId, runId: r.id, correlationId: r.correlationId });
  return r;
}
export function failPipelineRun(runId: string, error: string): PipelineRun | null {
  const r = getPipelineRun(runId); if (!r || r.status !== "running") return null;
  r.status = "failed"; r.completedAt = new Date().toISOString(); r.error = error;
  storePipelineRun(r);
  const p = getPipeline(r.pipelineId); if (p) { p.status = "failed"; p.updatedAt = r.completedAt; storePipeline(p); }
  publishDataEvent("PipelineFailed", null, { pipelineId: r.pipelineId, runId: r.id, error, correlationId: r.correlationId });
  return r;
}
export function getPipelineRunById(id: string) { return getPipelineRun(id); }
export function listPipelineRuns(status?: PipelineStatus) { const all = getAllPipelineRuns(); return status ? all.filter(r => r.status === status) : all; }
export function supportsAllPipelineStatuses(): PipelineStatus[] { return ["pending", "running", "completed", "failed", "cancelled", "paused"]; }

// System 8 — Snapshot Platform
export function createSnapshot(input: { datasetId: string; type?: SnapshotType; sizeBytes?: number; recordCount?: number; retentionDays?: number | null }): SnapshotRecord {
  const now = new Date().toISOString();
  const s: SnapshotRecord = { id: randomUUID(), datasetId: input.datasetId, type: input.type ?? "incremental", status: "created", version: 1, sizeBytes: input.sizeBytes ?? 0, recordCount: input.recordCount ?? 0, createdAt: now, expiresAt: input.retentionDays ? new Date(Date.now() + input.retentionDays * 24 * 3600 * 1000).toISOString() : null, restoredAt: null, correlationId: randomUUID() };
  storeSnapshot(s);
  publishDataEvent("SnapshotCreated", null, { snapshotId: s.id, datasetId: input.datasetId, type: s.type });
  return s;
}
export function getSnapshotById(id: string) { return getSnapshot(id); }
export function listSnapshots(status?: SnapshotStatus) { const all = getAllSnapshots(); return status ? all.filter(s => s.status === status) : all; }
export function restoreSnapshot(id: string): SnapshotRecord | null {
  const s = getSnapshot(id); if (!s || s.status !== "created") return null;
  s.status = "restored"; s.restoredAt = new Date().toISOString(); storeSnapshot(s);
  return s;
}
export function expireSnapshot(id: string): SnapshotRecord | null {
  const s = getSnapshot(id); if (!s || s.status !== "created") return null;
  s.status = "expired"; storeSnapshot(s);
  return s;
}
export function supportsAllSnapshotTypes(): SnapshotType[] { return ["incremental", "full", "point_in_time"]; }
export function supportsAllSnapshotStatuses(): SnapshotStatus[] { return ["created", "restoring", "restored", "expired", "failed"]; }
