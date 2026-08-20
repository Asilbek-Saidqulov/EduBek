/** In-memory repository for Integration Platform. Phase 6G.23. */
import type {
  ConnectorDefinition, ConnectorLifecycleEvent, AuthReference,
  SyncJob, ImportJob, ExportJob, IntegrationWebhook,
  ExternalApiDef, ConnectorHealth, ConnectorRateLimit,
  DataMapping, ConflictRecord, SyncSchedule,
  IntegrationAuditEntry,
} from "./types";

const connectors = new Map<string, ConnectorDefinition>();
const lifecycleEvents = new Map<string, ConnectorLifecycleEvent[]>();
const authRefs = new Map<string, AuthReference>();
const syncJobs = new Map<string, SyncJob>();
const importJobs = new Map<string, ImportJob>();
const exportJobs = new Map<string, ExportJob>();
const webhooks = new Map<string, IntegrationWebhook>();
const apiDefs = new Map<string, ExternalApiDef>();
const healthRecords = new Map<string, ConnectorHealth>();
const rateLimits = new Map<string, ConnectorRateLimit>();
const mappings = new Map<string, DataMapping>();
const conflicts = new Map<string, ConflictRecord>();
const schedules = new Map<string, SyncSchedule>();
const audit: IntegrationAuditEntry[] = [];

export const storeConnector = (c: ConnectorDefinition) => connectors.set(c.id, c);
export const getConnector = (id: string) => connectors.get(id) ?? null;
export const getConnectorByKey = (key: string) => Array.from(connectors.values()).find(c => c.key === key) ?? null;
export const getAllConnectors = () => Array.from(connectors.values());

export const storeLifecycleEvent = (e: ConnectorLifecycleEvent) => { const l = lifecycleEvents.get(e.connectorId) ?? []; l.push(e); lifecycleEvents.set(e.connectorId, l); };
export const getLifecycleEvents = (connectorId: string) => lifecycleEvents.get(connectorId) ?? [];

export const storeAuthRef = (a: AuthReference) => authRefs.set(a.id, a);
export const getAuthRef = (id: string) => authRefs.get(id) ?? null;
export const getAllAuthRefs = () => Array.from(authRefs.values());
export const getAuthRefsForConnector = (connectorId: string) => Array.from(authRefs.values()).filter(a => a.connectorId === connectorId);

export const storeSyncJob = (s: SyncJob) => syncJobs.set(s.id, s);
export const getSyncJob = (id: string) => syncJobs.get(id) ?? null;
export const getAllSyncJobs = () => Array.from(syncJobs.values());

export const storeImportJob = (i: ImportJob) => importJobs.set(i.id, i);
export const getImportJob = (id: string) => importJobs.get(id) ?? null;
export const getAllImportJobs = () => Array.from(importJobs.values());

export const storeExportJob = (e: ExportJob) => exportJobs.set(e.id, e);
export const getExportJob = (id: string) => exportJobs.get(id) ?? null;
export const getAllExportJobs = () => Array.from(exportJobs.values());

export const storeWebhook = (w: IntegrationWebhook) => webhooks.set(w.id, w);
export const getWebhook = (id: string) => webhooks.get(id) ?? null;
export const getAllWebhooks = () => Array.from(webhooks.values());
export const getWebhooksForConnector = (connectorId: string) => Array.from(webhooks.values()).filter(w => w.connectorId === connectorId);

export const storeApiDef = (a: ExternalApiDef) => apiDefs.set(a.id, a);
export const getApiDef = (id: string) => apiDefs.get(id) ?? null;
export const getAllApiDefs = () => Array.from(apiDefs.values());

export const storeHealth = (h: ConnectorHealth) => healthRecords.set(h.id, h);
export const getHealth = (id: string) => healthRecords.get(id) ?? null;
export const getHealthForConnector = (connectorId: string) => Array.from(healthRecords.values()).find(h => h.connectorId === connectorId) ?? null;
export const getAllHealth = () => Array.from(healthRecords.values());

export const storeRateLimit = (r: ConnectorRateLimit) => rateLimits.set(r.id, r);
export const getRateLimit = (id: string) => rateLimits.get(id) ?? null;
export const getRateLimitForConnector = (connectorId: string) => Array.from(rateLimits.values()).find(r => r.connectorId === connectorId) ?? null;
export const getAllRateLimits = () => Array.from(rateLimits.values());

export const storeMapping = (m: DataMapping) => mappings.set(m.id, m);
export const getMapping = (id: string) => mappings.get(id) ?? null;
export const getAllMappings = () => Array.from(mappings.values());
export const getMappingsForConnector = (connectorId: string) => Array.from(mappings.values()).filter(m => m.connectorId === connectorId);

export const storeConflict = (c: ConflictRecord) => conflicts.set(c.id, c);
export const getConflict = (id: string) => conflicts.get(id) ?? null;
export const getAllConflicts = () => Array.from(conflicts.values());

export const storeSchedule = (s: SyncSchedule) => schedules.set(s.id, s);
export const getSchedule = (id: string) => schedules.get(id) ?? null;
export const getAllSchedules = () => Array.from(schedules.values());

export const appendAudit = (e: IntegrationAuditEntry) => audit.push(e);
export const getAllAuditEntries = () => audit.slice();
export const getAuditForConnector = (connectorId: string) => audit.filter(e => e.connectorId === connectorId);

export function _resetRepositoryForTesting() {
  connectors.clear(); lifecycleEvents.clear(); authRefs.clear();
  syncJobs.clear(); importJobs.clear(); exportJobs.clear();
  webhooks.clear(); apiDefs.clear(); healthRecords.clear();
  rateLimits.clear(); mappings.clear(); conflicts.clear();
  schedules.clear(); audit.length = 0;
}

// ---------------------------------------------------------------------------
// fetch* aliases — Turbopack requires these to be statically exported.
// ---------------------------------------------------------------------------

export const fetchIntegrations = () => getAllConnectors();
export const fetchApiKeys = () => getAllAuthRefs();
export const fetchOAuthClients = () => getAllAuthRefs();
export const fetchWebhookEndpoints = () => getAllConnectors();
export const fetchWebhookDeliveries = () => getAllConnectors();
export const fetchIntegrationSyncLogs = () => getAllSyncJobs();

/** Safe JSON parse helper — returns the default value on parse failure. */
export function safeParse<T>(value: unknown, defaultValue: T): T {
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T ?? defaultValue;
}

/** Event subscriptions — alias for webhook list (integration platform). */
export const fetchEventSubscriptions = () => getAllConnectors();
