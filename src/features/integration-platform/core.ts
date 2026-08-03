/** Systems 1-10: Registry, Lifecycle, Auth, Sync, Import, Export, Webhooks, External API, Health, Rate Limiting. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeConnector, getConnector, getConnectorByKey, getAllConnectors,
  storeLifecycleEvent, getLifecycleEvents,
  storeAuthRef, getAuthRef, getAllAuthRefs, getAuthRefsForConnector,
  storeSyncJob, getSyncJob, getAllSyncJobs,
  storeImportJob, getImportJob, getAllImportJobs,
  storeExportJob, getExportJob, getAllExportJobs,
  storeWebhook, getWebhook, getAllWebhooks, getWebhooksForConnector,
  storeApiDef, getApiDef, getAllApiDefs,
  storeHealth, getHealth, getHealthForConnector, getAllHealth,
  storeRateLimit, getRateLimit, getRateLimitForConnector, getAllRateLimits,
  appendAudit,
} from "./repository";
import type {
  ConnectorDefinition, ConnectorType, ConnectorStatus,
  ConnectorLifecycleEvent, LifecycleAction,
  AuthReference, AuthRefType,
  SyncJob, SyncDirection, SyncMode, SyncStatus,
  ImportJob, ImportFormat, ImportStatus,
  ExportJob, ExportFormat, ExportStatus,
  IntegrationWebhook, WebhookDirection, WebhookStatus,
  ExternalApiDef,
  ConnectorHealth, HealthState,
  ConnectorRateLimit,
} from "./types";
import { publishIntegrationEvent } from "./event-bus-bridge";

const log = getLogger("integration.core");

// ===== System 1 — Connector Registry =====
export function registerConnector(input: {
  key: string; name: string; type: ConnectorType;
  version: string; provider: string;
  capabilities?: string[]; direction?: "inbound" | "outbound" | "bidirectional";
  ownerId: string; signature: string;
  status?: ConnectorStatus; metadata?: Record<string, unknown>;
}): ConnectorDefinition {
  if (getConnectorByKey(input.key)) throw new Error(`Connector key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const c: ConnectorDefinition = {
    id: randomUUID(), key: input.key, name: input.name, type: input.type,
    status: input.status ?? "draft", version: input.version, provider: input.provider,
    capabilities: input.capabilities ?? [], direction: input.direction ?? "bidirectional",
    ownerId: input.ownerId, signature: input.signature,
    createdAt: now, updatedAt: now, removedAt: null, metadata: input.metadata ?? {},
  };
  storeConnector(c);
  return c;
}
export function getConnectorById(id: string) { return getConnector(id); }
export function getConnectorByKeyStr(key: string) { return getConnectorByKey(key); }
export function listConnectors(type?: ConnectorType, status?: ConnectorStatus) {
  let all = getAllConnectors();
  if (type) all = all.filter(c => c.type === type);
  if (status) all = all.filter(c => c.status === status);
  return all;
}
export function supportsAllConnectorTypes() { return ["education", "identity", "productivity", "data", "communication", "assessment", "custom"]; }
export function supportsAllConnectorStatuses() { return ["draft", "installed", "enabled", "disabled", "suspended", "removed"]; }

// ===== System 2 — Connector Lifecycle =====
const VALID_LIFECYCLE: Record<ConnectorStatus, ConnectorStatus[]> = {
  draft: ["installed", "removed"],
  installed: ["enabled", "disabled", "removed", "suspended"],
  enabled: ["disabled", "suspended", "removed"],
  disabled: ["enabled", "removed", "suspended"],
  suspended: ["enabled", "disabled", "removed"],
  removed: [],
};
export function canTransitionConnector(from: ConnectorStatus, to: ConnectorStatus) { return VALID_LIFECYCLE[from]?.includes(to) ?? false; }

export function transitionConnector(connectorId: string, toStatus: ConnectorStatus, actorId: string, reason: string, toVersion?: string): ConnectorDefinition | null {
  const c = getConnector(connectorId); if (!c) return null;
  if (!canTransitionConnector(c.status, toStatus)) return null;
  const fromVersion = c.version;
  const fromStatus = c.status;
  const now = new Date().toISOString();
  c.status = toStatus; c.updatedAt = now;
  if (toVersion) c.version = toVersion;
  if (toStatus === "removed") c.removedAt = now;
  storeConnector(c);
  const action: LifecycleAction = toStatus === "installed" ? "install" : toStatus === "enabled" ? "enable" : toStatus === "disabled" ? "disable" : toStatus === "suspended" ? "suspend" : toStatus === "removed" ? "remove" : "install";
  const evt: ConnectorLifecycleEvent = { id: randomUUID(), connectorId, action, fromVersion, toVersion: c.version, actorId, reason, occurredAt: now, correlationId: randomUUID() };
  storeLifecycleEvent(evt);
  appendAudit({ id: randomUUID(), category: "connector", action: `lifecycle:${action}`, connectorId, actorId, before: { status: fromStatus }, after: { status: toStatus }, reason, correlationId: evt.correlationId, occurredAt: now, immutable: true, metadata: {} });
  if (toStatus === "installed") publishIntegrationEvent("ConnectorInstalled", actorId, { connectorId, version: c.version });
  if (toStatus === "removed") publishIntegrationEvent("ConnectorRemoved", actorId, { connectorId });
  return c;
}
export function installConnector(id: string, actorId: string) { return transitionConnector(id, "installed", actorId, "Manual install"); }
export function enableConnector(id: string, actorId: string) { return transitionConnector(id, "enabled", actorId, "Manual enable"); }
export function disableConnector(id: string, actorId: string, reason: string) { return transitionConnector(id, "disabled", actorId, reason); }
export function suspendConnector(id: string, actorId: string, reason: string) { return transitionConnector(id, "suspended", actorId, reason); }
export function upgradeConnector(id: string, newVersion: string, actorId: string) {
  const c = getConnector(id); if (!c) return null;
  // Upgrade can happen in any active state — just update the version
  const now = new Date().toISOString();
  const fromVersion = c.version;
  c.version = newVersion; c.updatedAt = now;
  storeConnector(c);
  const evt: ConnectorLifecycleEvent = { id: randomUUID(), connectorId: id, action: "upgrade", fromVersion, toVersion: newVersion, actorId, reason: `Upgraded to ${newVersion}`, occurredAt: now, correlationId: randomUUID() };
  storeLifecycleEvent(evt);
  appendAudit({ id: randomUUID(), category: "connector", action: "lifecycle:upgrade", connectorId: id, actorId, before: { version: fromVersion }, after: { version: newVersion }, reason: `Upgraded to ${newVersion}`, correlationId: evt.correlationId, occurredAt: now, immutable: true, metadata: {} });
  return c;
}
export function removeConnector(id: string, actorId: string, reason: string) { return transitionConnector(id, "removed", actorId, reason); }
export function getConnectorLifecycle(id: string) { return getLifecycleEvents(id); }

// ===== System 3 — Authentication References =====
export function createAuthReference(input: {
  connectorId: string; type: AuthRefType; referenceKey: string;
  scopes?: string[]; expiresAt?: string | null; metadata?: Record<string, unknown>;
}): AuthReference {
  const now = new Date().toISOString();
  const a: AuthReference = {
    id: randomUUID(), connectorId: input.connectorId, type: input.type,
    referenceKey: input.referenceKey, scopes: input.scopes ?? [],
    expiresAt: input.expiresAt ?? null, active: true,
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeAuthRef(a);
  return a;
}
export function getAuthReferenceById(id: string) { return getAuthRef(id); }
export function listAuthRefs(connectorId?: string) { return connectorId ? getAuthRefsForConnector(connectorId) : getAllAuthRefs(); }
export function deactivateAuthRef(id: string) { const a = getAuthRef(id); if (!a) return null; a.active = false; a.updatedAt = new Date().toISOString(); storeAuthRef(a); return a; }
export function supportsAllAuthRefTypes() { return ["oauth", "api_key", "jwt", "basic", "secret_ref", "certificate"]; }

// ===== System 4 — Synchronization Engine =====
export function createSyncJob(input: {
  connectorId: string; direction: SyncDirection; mode: SyncMode;
  entityTypes?: string[]; metadata?: Record<string, unknown>;
}): SyncJob {
  const now = new Date().toISOString();
  const job: SyncJob = {
    id: randomUUID(), connectorId: input.connectorId, direction: input.direction, mode: input.mode,
    status: "pending", entityTypes: input.entityTypes ?? [],
    startedAt: now, completedAt: null,
    recordsProcessed: 0, recordsSucceeded: 0, recordsFailed: 0,
    error: null, correlationId: randomUUID(), metadata: input.metadata ?? {},
  };
  storeSyncJob(job);
  publishIntegrationEvent("ConnectorSyncStarted", null, { syncJobId: job.id, connectorId: input.connectorId, correlationId: job.correlationId });
  return job;
}
export function getSyncJobById(id: string) { return getSyncJob(id); }
export function listSyncJobs(status?: SyncStatus, connectorId?: string) {
  let all = getAllSyncJobs();
  if (status) all = all.filter(s => s.status === status);
  if (connectorId) all = all.filter(s => s.connectorId === connectorId);
  return all;
}
export function startSyncJob(id: string): SyncJob | null { const s = getSyncJob(id); if (!s || s.status !== "pending") return null; s.status = "running"; storeSyncJob(s); return s; }
export function completeSyncJob(id: string, processed: number, succeeded: number, failed: number): SyncJob | null {
  const s = getSyncJob(id); if (!s || s.status !== "running") return null;
  s.status = "completed"; s.completedAt = new Date().toISOString();
  s.recordsProcessed = processed; s.recordsSucceeded = succeeded; s.recordsFailed = failed;
  storeSyncJob(s);
  publishIntegrationEvent("ConnectorSyncCompleted", null, { syncJobId: s.id, connectorId: s.connectorId, correlationId: s.correlationId });
  return s;
}
export function failSyncJob(id: string, error: string): SyncJob | null {
  const s = getSyncJob(id); if (!s || (s.status !== "running" && s.status !== "pending")) return null;
  s.status = "failed"; s.completedAt = new Date().toISOString(); s.error = error;
  storeSyncJob(s);
  publishIntegrationEvent("ConnectorSyncFailed", null, { syncJobId: s.id, connectorId: s.connectorId, error, correlationId: s.correlationId });
  return s;
}
export function supportsAllSyncDirections() { return ["one_way_in", "one_way_out", "two_way"]; }
export function supportsAllSyncModes() { return ["incremental", "full"]; }
export function supportsAllSyncStatuses() { return ["pending", "running", "completed", "failed", "cancelled"]; }

// ===== System 5 — Import Platform =====
export function createImportJob(input: {
  connectorId?: string | null; format: ImportFormat; sourceRef: string;
  totalRecords?: number; metadata?: Record<string, unknown>;
}): ImportJob {
  const now = new Date().toISOString();
  const job: ImportJob = {
    id: randomUUID(), connectorId: input.connectorId ?? null, format: input.format,
    status: "queued", sourceRef: input.sourceRef,
    totalRecords: input.totalRecords ?? 0, processedRecords: 0, succeededRecords: 0, failedRecords: 0,
    startedAt: now, completedAt: null, error: null, correlationId: randomUUID(), metadata: input.metadata ?? {},
  };
  storeImportJob(job);
  return job;
}
export function getImportJobById(id: string) { return getImportJob(id); }
export function listImportJobs(status?: ImportStatus) { const all = getAllImportJobs(); return status ? all.filter(j => j.status === status) : all; }
export function startImportJob(id: string): ImportJob | null { const j = getImportJob(id); if (!j || j.status !== "queued") return null; j.status = "processing"; storeImportJob(j); return j; }
export function completeImportJob(id: string, processed: number, succeeded: number, failed: number, partial?: boolean): ImportJob | null {
  const j = getImportJob(id); if (!j || j.status !== "processing") return null;
  j.status = partial ? "partial" : "completed"; j.completedAt = new Date().toISOString();
  j.processedRecords = processed; j.succeededRecords = succeeded; j.failedRecords = failed;
  storeImportJob(j);
  publishIntegrationEvent("ImportCompleted", null, { importJobId: j.id, format: j.format, correlationId: j.correlationId });
  return j;
}
export function failImportJob(id: string, error: string): ImportJob | null {
  const j = getImportJob(id); if (!j || j.status === "completed") return null;
  j.status = "failed"; j.completedAt = new Date().toISOString(); j.error = error;
  storeImportJob(j); return j;
}
export function supportsAllImportFormats() { return ["csv", "excel", "json", "ims_cc", "qti", "scorm", "xml"]; }
export function supportsAllImportStatuses() { return ["queued", "processing", "completed", "failed", "partial"]; }

// ===== System 6 — Export Platform =====
export function createExportJob(input: {
  connectorId?: string | null; format: ExportFormat; destinationRef: string;
  filter?: Record<string, unknown> | null; totalRecords?: number; metadata?: Record<string, unknown>;
}): ExportJob {
  const now = new Date().toISOString();
  const job: ExportJob = {
    id: randomUUID(), connectorId: input.connectorId ?? null, format: input.format,
    status: "queued", destinationRef: input.destinationRef,
    filter: input.filter ?? null, totalRecords: input.totalRecords ?? 0, exportedRecords: 0,
    startedAt: now, completedAt: null, error: null, correlationId: randomUUID(), metadata: input.metadata ?? {},
  };
  storeExportJob(job);
  return job;
}
export function getExportJobById(id: string) { return getExportJob(id); }
export function listExportJobs(status?: ExportStatus) { const all = getAllExportJobs(); return status ? all.filter(j => j.status === status) : all; }
export function startExportJob(id: string): ExportJob | null { const j = getExportJob(id); if (!j || j.status !== "queued") return null; j.status = "processing"; storeExportJob(j); return j; }
export function completeExportJob(id: string, exported: number): ExportJob | null {
  const j = getExportJob(id); if (!j || j.status !== "processing") return null;
  j.status = "completed"; j.completedAt = new Date().toISOString(); j.exportedRecords = exported;
  storeExportJob(j);
  publishIntegrationEvent("ExportCompleted", null, { exportJobId: j.id, format: j.format, correlationId: j.correlationId });
  return j;
}
export function failExportJob(id: string, error: string): ExportJob | null {
  const j = getExportJob(id); if (!j || j.status === "completed") return null;
  j.status = "failed"; j.completedAt = new Date().toISOString(); j.error = error;
  storeExportJob(j); return j;
}
export function supportsAllExportFormats() { return ["csv", "excel", "json", "ims_cc", "qti", "xml", "pdf"]; }
export function supportsAllExportStatuses() { return ["queued", "processing", "completed", "failed", "streaming"]; }

// ===== System 7 — Webhook Platform =====
export function registerWebhook(input: {
  connectorId: string; direction: WebhookDirection; url: string;
  events: string[]; signingSecretRef: string;
  retryMax?: number; retryBackoffMs?: number; metadata?: Record<string, unknown>;
}): IntegrationWebhook {
  const now = new Date().toISOString();
  const w: IntegrationWebhook = {
    id: randomUUID(), connectorId: input.connectorId, direction: input.direction,
    url: input.url, events: input.events, status: "active",
    signingSecretRef: input.signingSecretRef,
    retryMax: input.retryMax ?? 3, retryBackoffMs: input.retryBackoffMs ?? 1000,
    deliveryCount: 0, failureCount: 0, lastTriggeredAt: null, lastStatus: null,
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeWebhook(w);
  return w;
}
export function getWebhookById(id: string) { return getWebhook(id); }
export function listWebhooks(connectorId?: string) { return connectorId ? getWebhooksForConnector(connectorId) : getAllWebhooks(); }
export function pauseWebhook(id: string) { const w = getWebhook(id); if (!w || w.status !== "active") return null; w.status = "paused"; w.updatedAt = new Date().toISOString(); storeWebhook(w); return w; }
export function revokeWebhook(id: string) { const w = getWebhook(id); if (!w || w.status === "revoked") return null; w.status = "revoked"; w.updatedAt = new Date().toISOString(); storeWebhook(w); return w; }
export function recordWebhookDelivery(id: string, success: boolean) {
  const w = getWebhook(id); if (!w) return null;
  w.deliveryCount += 1; w.lastTriggeredAt = new Date().toISOString(); w.lastStatus = success ? "success" : "failed";
  if (!success) w.failureCount += 1;
  w.updatedAt = w.lastTriggeredAt; storeWebhook(w);
  if (w.direction === "incoming" && success) publishIntegrationEvent("WebhookReceived", null, { webhookId: w.id, connectorId: w.connectorId });
  if (w.direction === "outgoing") publishIntegrationEvent("WebhookDelivered", null, { webhookId: w.id, success });
  return w;
}
export function supportsAllWebhookDirections() { return ["incoming", "outgoing"]; }
export function supportsAllWebhookStatuses() { return ["active", "paused", "revoked"]; }

// ===== System 8 — External API Registry =====
export function registerExternalApi(input: {
  connectorId: string; key: string; name: string; baseUrl: string; version: string;
  schemas?: Record<string, unknown>; rateLimitPerMinute?: number; rateLimitPerHour?: number;
  active?: boolean; metadata?: Record<string, unknown>;
}): ExternalApiDef {
  const now = new Date().toISOString();
  const api: ExternalApiDef = {
    id: randomUUID(), connectorId: input.connectorId, key: input.key, name: input.name,
    baseUrl: input.baseUrl, version: input.version,
    schemas: input.schemas ?? {}, rateLimitPerMinute: input.rateLimitPerMinute ?? 100, rateLimitPerHour: input.rateLimitPerHour ?? 1000,
    active: input.active ?? true, createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeApiDef(api);
  return api;
}
export function getExternalApiById(id: string) { return getApiDef(id); }
export function listExternalApis(active?: boolean) { const all = getAllApiDefs(); return active === undefined ? all : all.filter(a => a.active === active); }

// ===== System 9 — Connector Health =====
export function recordConnectorHealth(input: {
  connectorId: string; state?: HealthState; latencyMs?: number | null;
  availabilityPercent?: number; failureCount?: number; retryCount?: number;
  heartbeatAt?: string | null; metadata?: Record<string, unknown>;
}): ConnectorHealth {
  const h: ConnectorHealth = {
    id: randomUUID(), connectorId: input.connectorId,
    state: input.state ?? "healthy", latencyMs: input.latencyMs ?? null,
    availabilityPercent: input.availabilityPercent ?? 100,
    failureCount: input.failureCount ?? 0, lastFailureAt: null,
    retryCount: input.retryCount ?? 0, heartbeatAt: input.heartbeatAt ?? null,
    checkedAt: new Date().toISOString(), metadata: input.metadata ?? {},
  };
  storeHealth(h);
  return h;
}
export function getHealthById(id: string) { return getHealth(id); }
export function getHealthForConnectorId(connectorId: string) { return getHealthForConnector(connectorId); }
export function listHealth() { return getAllHealth(); }
export function recordConnectorFailure(connectorId: string, reason: string) {
  const h = getHealthForConnector(connectorId); if (!h) return null;
  h.failureCount += 1; h.lastFailureAt = new Date().toISOString();
  if (h.failureCount > 5) h.state = "unhealthy"; else if (h.failureCount > 2) h.state = "degraded";
  storeHealth(h); return h;
}
export function recordHeartbeat(connectorId: string) {
  const h = getHealthForConnector(connectorId); if (!h) return null;
  h.heartbeatAt = new Date().toISOString(); h.state = "healthy";
  storeHealth(h); return h;
}
export function supportsAllHealthStates() { return ["healthy", "degraded", "unhealthy", "unknown"]; }

// ===== System 10 — Rate Limiting =====
export function setConnectorRateLimit(input: {
  connectorId: string; quotaPerMinute?: number; quotaPerHour?: number; quotaPerDay?: number;
  burstLimit?: number; concurrencyLimit?: number;
}): ConnectorRateLimit {
  const rl: ConnectorRateLimit = {
    id: randomUUID(), connectorId: input.connectorId,
    quotaPerMinute: input.quotaPerMinute ?? 60, quotaPerHour: input.quotaPerHour ?? 1000, quotaPerDay: input.quotaPerDay ?? 10000,
    burstLimit: input.burstLimit ?? 10, concurrencyLimit: input.concurrencyLimit ?? 5,
    currentWindow: { minute: 0, hour: 0, day: 0, concurrent: 0 },
    updatedAt: new Date().toISOString(),
  };
  storeRateLimit(rl);
  return rl;
}
export function getRateLimitById(id: string) { return getRateLimit(id); }
export function getRateLimitForConnectorId(connectorId: string) { return getRateLimitForConnector(connectorId); }
export function listRateLimits() { return getAllRateLimits(); }
export function checkRateLimit(connectorId: string): { allowed: boolean; reason: string | null } {
  const rl = getRateLimitForConnector(connectorId); if (!rl) return { allowed: true, reason: null };
  if (rl.currentWindow.minute >= rl.quotaPerMinute) return { allowed: false, reason: "minute_quota_exceeded" };
  if (rl.currentWindow.hour >= rl.quotaPerHour) return { allowed: false, reason: "hour_quota_exceeded" };
  if (rl.currentWindow.day >= rl.quotaPerDay) return { allowed: false, reason: "day_quota_exceeded" };
  if (rl.currentWindow.concurrent >= rl.concurrencyLimit) return { allowed: false, reason: "concurrency_exceeded" };
  return { allowed: true, reason: null };
}
export function recordRateLimitUsage(connectorId: string) {
  const rl = getRateLimitForConnector(connectorId); if (!rl) return null;
  rl.currentWindow.minute += 1; rl.currentWindow.hour += 1; rl.currentWindow.day += 1;
  rl.updatedAt = new Date().toISOString(); storeRateLimit(rl); return rl;
}
export function resetRateLimitWindow(connectorId: string, window: "minute" | "hour" | "day") {
  const rl = getRateLimitForConnector(connectorId); if (!rl) return null;
  rl.currentWindow[window] = 0; rl.updatedAt = new Date().toISOString(); storeRateLimit(rl); return rl;
}
