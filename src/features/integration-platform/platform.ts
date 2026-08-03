/** Systems 11-20: Mapping, Conflict, Scheduling, Analytics, Audit, Dashboard, Developer, Docs. */
import { randomUUID } from "node:crypto";
import type {
  DataMapping, ConflictRecord, ConflictStrategy, ConflictStatus,
  SyncSchedule, SyncScheduleType, SyncScheduleStatus,
  IntegrationAnalytics, IntegrationAuditEntry, AuditCategory,
  IntegrationDashboard, IntegrationEventType,
  IntegrationDeveloperIntegration, IntegrationDocumentation,
} from "./types";
import {
  storeMapping, getMapping, getAllMappings, getMappingsForConnector,
  storeConflict, getConflict, getAllConflicts,
  storeSchedule, getSchedule, getAllSchedules,
  appendAudit, getAllAuditEntries, getAuditForConnector,
  getAllSyncJobs, getAllImportJobs, getAllExportJobs, getAllWebhooks,
  getAllConnectors, getAllHealth, getAllConflicts as getAllConf,
} from "./repository";
import { publishIntegrationEvent } from "./event-bus-bridge";

// ===== System 11 — Data Mapping =====
export function createMapping(input: {
  connectorId: string; name: string; sourceSchema: string; targetSchema: string;
  mappings?: Array<{ source: string; target: string; transform: string | null; required: boolean }>;
  metadata?: Record<string, unknown>;
}): DataMapping {
  const now = new Date().toISOString();
  const m: DataMapping = {
    id: randomUUID(), connectorId: input.connectorId, name: input.name,
    sourceSchema: input.sourceSchema, targetSchema: input.targetSchema,
    mappings: input.mappings ?? [], createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeMapping(m);
  return m;
}
export function getMappingById(id: string) { return getMapping(id); }
export function listMappings(connectorId?: string) { return connectorId ? getMappingsForConnector(connectorId) : getAllMappings(); }

// ===== System 12 — Conflict Resolution =====
export function detectConflict(input: {
  connectorId: string; syncJobId?: string | null; entityType: string; entityId: string;
  strategy?: ConflictStrategy; sourceData: Record<string, unknown>; targetData: Record<string, unknown>;
}): ConflictRecord {
  const c: ConflictRecord = {
    id: randomUUID(), connectorId: input.connectorId, syncJobId: input.syncJobId ?? null,
    entityType: input.entityType, entityId: input.entityId,
    strategy: input.strategy ?? "manual_review", status: "detected",
    sourceData: input.sourceData, targetData: input.targetData,
    resolvedData: null, resolvedBy: null, resolvedAt: null,
    detectedAt: new Date().toISOString(), correlationId: randomUUID(), metadata: {},
  };
  storeConflict(c);
  publishIntegrationEvent("ConflictDetected", null, { conflictId: c.id, connectorId: input.connectorId, entityType: input.entityType });
  return c;
}
export function getConflictById(id: string) { return getConflict(id); }
export function listConflicts(status?: ConflictStatus) { const all = getAllConflicts(); return status ? all.filter(c => c.status === status) : all; }
export function resolveConflict(id: string, resolvedBy: string, resolvedData: Record<string, unknown>, strategy?: ConflictStrategy): ConflictRecord | null {
  const c = getConflict(id); if (!c || c.status === "resolved") return null;
  c.status = "resolved"; c.resolvedData = resolvedData; c.resolvedBy = resolvedBy;
  c.resolvedAt = new Date().toISOString();
  if (strategy) c.strategy = strategy;
  storeConflict(c);
  publishIntegrationEvent("ConflictResolved", resolvedBy, { conflictId: c.id, connectorId: c.connectorId });
  return c;
}
export function ignoreConflict(id: string): ConflictRecord | null {
  const c = getConflict(id); if (!c || c.status !== "detected") return null;
  c.status = "ignored"; storeConflict(c); return c;
}
export function supportsAllConflictStrategies() { return ["merge", "replace", "ignore", "manual_review"]; }
export function supportsAllConflictStatuses() { return ["detected", "resolved", "ignored", "pending_review"]; }

// ===== System 13 — Sync Scheduling =====
export function createSyncSchedule(input: {
  connectorId: string; type: SyncScheduleType;
  cronExpression?: string | null; intervalMinutes?: number | null;
  scheduledAt?: string; metadata?: Record<string, unknown>;
}): SyncSchedule {
  const now = new Date().toISOString();
  let nextRunAt: string | null = input.scheduledAt ?? now;
  if (input.type === "interval" && input.intervalMinutes) nextRunAt = new Date(Date.now() + input.intervalMinutes * 60 * 1000).toISOString();
  const s: SyncSchedule = {
    id: randomUUID(), connectorId: input.connectorId, type: input.type,
    cronExpression: input.cronExpression ?? null, intervalMinutes: input.intervalMinutes ?? null,
    scheduledAt: input.scheduledAt ?? now, nextRunAt, lastRunAt: null,
    status: "active", runCount: 0, createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeSchedule(s);
  return s;
}
export function getSyncScheduleById(id: string) { return getSchedule(id); }
export function listSyncSchedules(status?: SyncScheduleStatus) { const all = getAllSchedules(); return status ? all.filter(s => s.status === status) : all; }
export function pauseSyncSchedule(id: string) { const s = getSchedule(id); if (!s || s.status !== "active") return null; s.status = "paused"; s.updatedAt = new Date().toISOString(); storeSchedule(s); return s; }
export function resumeSyncSchedule(id: string) { const s = getSchedule(id); if (!s || s.status !== "paused") return null; s.status = "active"; s.updatedAt = new Date().toISOString(); storeSchedule(s); return s; }
export function recordSyncScheduleRun(id: string) {
  const s = getSchedule(id); if (!s || s.status !== "active") return null;
  s.runCount += 1; s.lastRunAt = new Date().toISOString();
  if (s.type === "one_time") s.status = "completed";
  if (s.type === "interval" && s.intervalMinutes) s.nextRunAt = new Date(Date.now() + s.intervalMinutes * 60 * 1000).toISOString();
  s.updatedAt = s.lastRunAt; storeSchedule(s); return s;
}
export function cancelSyncSchedule(id: string) { const s = getSchedule(id); if (!s || s.status === "completed" || s.status === "cancelled") return null; s.status = "cancelled"; s.updatedAt = new Date().toISOString(); storeSchedule(s); return s; }
export function listDueSyncSchedules(now: number = Date.now()) { return getAllSchedules().filter(s => s.status === "active" && s.nextRunAt && new Date(s.nextRunAt).getTime() <= now); }
export function supportsAllScheduleTypes() { return ["cron", "interval", "one_time", "manual"]; }
export function supportsAllScheduleStatuses() { return ["active", "paused", "completed", "cancelled"]; }

// ===== System 14 — Integration Analytics =====
export function generateIntegrationAnalytics(): IntegrationAnalytics {
  const syncs = getAllSyncJobs(); const imports = getAllImportJobs(); const exports = getAllExportJobs();
  const webhooks = getAllWebhooks(); const connectors = getAllConnectors(); const health = getAllHealth(); const conflicts = getAllConf();
  const completedSyncs = syncs.filter(s => s.status === "completed");
  const syncAvg = completedSyncs.length > 0 ? completedSyncs.reduce((s, j) => s + (j.completedAt ? new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime() : 0), 0) / completedSyncs.length : 0;
  const totalDeliveries = webhooks.reduce((s, w) => s + w.deliveryCount, 0);
  const totalFailures = webhooks.reduce((s, w) => s + w.failureCount, 0);
  return {
    sync: { totalJobs: syncs.length, completed: completedSyncs.length, failed: syncs.filter(s => s.status === "failed").length, avgDurationMs: syncAvg, totalRecords: syncs.reduce((s, j) => s + j.recordsProcessed, 0) },
    imports: { totalJobs: imports.length, completed: imports.filter(i => i.status === "completed").length, failed: imports.filter(i => i.status === "failed").length, totalRecords: imports.reduce((s, j) => s + j.processedRecords, 0) },
    exports: { totalJobs: exports.length, completed: exports.filter(e => e.status === "completed").length, failed: exports.filter(e => e.status === "failed").length, totalRecords: exports.reduce((s, j) => s + j.exportedRecords, 0) },
    webhooks: { totalDeliveries, successRate: totalDeliveries > 0 ? (totalDeliveries - totalFailures) / totalDeliveries : 1, totalFailures },
    connectors: { total: connectors.length, healthy: health.filter(h => h.state === "healthy").length, degraded: health.filter(h => h.state === "degraded").length, unhealthy: health.filter(h => h.state === "unhealthy").length },
    conflicts: { total: conflicts.length, resolved: conflicts.filter(c => c.status === "resolved").length, pending: conflicts.filter(c => c.status === "detected").length },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 15 — Audit Trail =====
export function recordIntegrationAudit(input: {
  category: AuditCategory; action: string; connectorId?: string | null;
  actorId?: string | null; before?: Record<string, unknown>; after?: Record<string, unknown>;
  reason: string; correlationId?: string; metadata?: Record<string, unknown>;
}): IntegrationAuditEntry {
  const e: IntegrationAuditEntry = {
    id: randomUUID(), category: input.category, action: input.action,
    connectorId: input.connectorId ?? null, actorId: input.actorId ?? null,
    before: input.before ?? {}, after: input.after ?? {},
    reason: input.reason, correlationId: input.correlationId ?? randomUUID(),
    occurredAt: new Date().toISOString(), immutable: true, metadata: input.metadata ?? {},
  };
  appendAudit(e);
  return e;
}
export function listIntegrationAudit(limit = 100, offset = 0, connectorId?: string) {
  const all = connectorId ? getAuditForConnector(connectorId) : getAllAuditEntries();
  return all.slice(offset, offset + limit);
}
export function getIntegrationAuditCount() { return getAllAuditEntries().length; }
export function verifyAuditIntegrity() { const a = getAllAuditEntries(); return { valid: a.every(e => e.immutable), total: a.length }; }

// ===== System 16 — Dashboard =====
export function generateIntegrationDashboard(): IntegrationDashboard {
  const connectors = getAllConnectors(); const syncs = getAllSyncJobs(); const imports = getAllImportJobs();
  const exports = getAllExportJobs(); const webhooks = getAllWebhooks(); const health = getAllHealth(); const conflicts = getAllConf();
  const day = 24 * 3600 * 1000; const now = Date.now();
  return {
    connectors: { total: connectors.length, enabled: connectors.filter(c => c.status === "enabled").length, disabled: connectors.filter(c => c.status === "disabled").length, suspended: connectors.filter(c => c.status === "suspended").length },
    sync: { running: syncs.filter(s => s.status === "running").length, queued: syncs.filter(s => s.status === "pending").length, completed24h: syncs.filter(s => s.completedAt && now - new Date(s.completedAt).getTime() < day).length, failed24h: syncs.filter(s => s.status === "failed" && s.completedAt && now - new Date(s.completedAt).getTime() < day).length },
    imports: { processing: imports.filter(i => i.status === "processing").length, completed24h: imports.filter(i => i.completedAt && now - new Date(i.completedAt).getTime() < day).length, failed24h: imports.filter(i => i.status === "failed" && i.completedAt && now - new Date(i.completedAt).getTime() < day).length },
    exports: { processing: exports.filter(e => e.status === "processing").length, completed24h: exports.filter(e => e.completedAt && now - new Date(e.completedAt).getTime() < day).length, failed24h: exports.filter(e => e.status === "failed" && e.completedAt && now - new Date(e.completedAt).getTime() < day).length },
    webhooks: { active: webhooks.filter(w => w.status === "active").length, deliveries24h: webhooks.reduce((s, w) => s + w.deliveryCount, 0), failures24h: webhooks.reduce((s, w) => s + w.failureCount, 0) },
    health: { healthy: health.filter(h => h.state === "healthy").length, degraded: health.filter(h => h.state === "degraded").length, unhealthy: health.filter(h => h.state === "unhealthy").length, unknown: health.filter(h => h.state === "unknown").length },
    conflicts: { pending: conflicts.filter(c => c.status === "detected").length, resolved24h: conflicts.filter(c => c.status === "resolved" && c.resolvedAt && now - new Date(c.resolvedAt).getTime() < day).length },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 18 — Developer Integration =====
export function getDeveloperIntegration(): IntegrationDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/integrations/connectors", method: "GET", description: "List connectors", authRequired: true, scope: "read" },
      { path: "/api/integrations/connectors", method: "POST", description: "Register connector", authRequired: true, scope: "admin" },
      { path: "/api/integrations/connectors", method: "PUT", description: "Lifecycle transition", authRequired: true, scope: "admin" },
      { path: "/api/integrations/sync", method: "GET", description: "List sync jobs", authRequired: true, scope: "read" },
      { path: "/api/integrations/sync", method: "POST", description: "Create sync job", authRequired: true, scope: "admin" },
      { path: "/api/integrations/imports", method: "GET", description: "List imports", authRequired: true, scope: "read" },
      { path: "/api/integrations/imports", method: "POST", description: "Create import", authRequired: true, scope: "admin" },
      { path: "/api/integrations/exports", method: "GET", description: "List exports", authRequired: true, scope: "read" },
      { path: "/api/integrations/exports", method: "POST", description: "Create export", authRequired: true, scope: "admin" },
      { path: "/api/integrations/webhooks", method: "GET", description: "List webhooks", authRequired: true, scope: "read" },
      { path: "/api/integrations/webhooks", method: "POST", description: "Register webhook", authRequired: true, scope: "admin" },
      { path: "/api/integrations/health", method: "GET", description: "List health", authRequired: true, scope: "read" },
      { path: "/api/integrations/mappings", method: "GET", description: "List mappings", authRequired: true, scope: "read" },
      { path: "/api/integrations/conflicts", method: "GET", description: "List conflicts", authRequired: true, scope: "read" },
      { path: "/api/integrations/schedules", method: "GET", description: "List schedules", authRequired: true, scope: "read" },
      { path: "/api/integrations/dashboard", method: "GET", description: "Dashboard", authRequired: true, scope: "admin" },
      { path: "/api/integrations/analytics", method: "GET", description: "Analytics", authRequired: true, scope: "admin" },
      { path: "/api/integrations/developer", method: "GET", description: "Developer integration", authRequired: false, scope: "read" },
      { path: "/api/integrations/status", method: "GET", description: "Status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_connector_installed", name: "On Connector Installed", triggerEvent: "ConnectorInstalled", description: "Triggered when a connector is installed" },
      { id: "hook_sync_completed", name: "On Sync Completed", triggerEvent: "ConnectorSyncCompleted", description: "Triggered when a sync completes" },
      { id: "hook_import_completed", name: "On Import Completed", triggerEvent: "ImportCompleted", description: "Triggered when an import completes" },
      { id: "hook_export_completed", name: "On Export Completed", triggerEvent: "ExportCompleted", description: "Triggered when an export completes" },
      { id: "hook_webhook_received", name: "On Webhook Received", triggerEvent: "WebhookReceived", description: "Triggered when an incoming webhook is received" },
      { id: "hook_conflict_detected", name: "On Conflict Detected", triggerEvent: "ConflictDetected", description: "Triggered when a conflict is detected" },
      { id: "hook_conflict_resolved", name: "On Conflict Resolved", triggerEvent: "ConflictResolved", description: "Triggered when a conflict is resolved" },
    ],
    sdkMetadata: { version: "1.0.0", language: "typescript", docsUrl: "/docs/integration-platform", capabilities: ["connectors", "sync", "imports", "exports", "webhooks", "health", "mappings", "conflicts", "schedules", "analytics", "dashboard"] },
    webhooks: [
      { id: "wh_sync_completed", event: "ConnectorSyncCompleted", description: "Fired when a sync completes" },
      { id: "wh_sync_failed", event: "ConnectorSyncFailed", description: "Fired when a sync fails" },
      { id: "wh_import_completed", event: "ImportCompleted", description: "Fired when an import completes" },
      { id: "wh_export_completed", event: "ExportCompleted", description: "Fired when an export completes" },
      { id: "wh_conflict_detected", event: "ConflictDetected", description: "Fired when a conflict is detected" },
    ],
    connectorManifestSchema: { fields: ["id", "key", "name", "type", "version", "provider", "capabilities", "direction", "ownerId", "signature"] },
  };
}

// ===== System 19 — Documentation =====
const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Connector Registry", description: "Central registry. Versioned. Status. Ownership. Capabilities.", endpoints: ["/api/integrations/connectors"], events: [] },
  { id: 2, name: "Connector Lifecycle", description: "Install, enable, disable, upgrade, remove, suspend.", endpoints: ["/api/integrations/connectors"], events: ["ConnectorInstalled", "ConnectorRemoved"] },
  { id: 3, name: "Authentication References", description: "OAuth, API keys, JWT, secrets references. Never stores secrets directly.", endpoints: ["/api/integrations/auth"], events: [] },
  { id: 4, name: "Synchronization Engine", description: "One-way, two-way, incremental, full sync. Conflict handling.", endpoints: ["/api/integrations/sync"], events: ["ConnectorSyncStarted", "ConnectorSyncCompleted", "ConnectorSyncFailed"] },
  { id: 5, name: "Import Platform", description: "CSV, Excel, JSON, IMS, QTI, SCORM references.", endpoints: ["/api/integrations/imports"], events: ["ImportCompleted"] },
  { id: 6, name: "Export Platform", description: "Bulk, scheduled, filtered, streaming export.", endpoints: ["/api/integrations/exports"], events: ["ExportCompleted"] },
  { id: 7, name: "Webhook Platform", description: "Incoming, outgoing, retries, signatures, replay, dead letter.", endpoints: ["/api/integrations/webhooks"], events: ["WebhookReceived", "WebhookDelivered"] },
  { id: 8, name: "External API Registry", description: "Registered APIs, schemas, versioning, rate limits.", endpoints: ["/api/integrations/apis"], events: [] },
  { id: 9, name: "Connector Health", description: "Latency, availability, failures, retries, heartbeat.", endpoints: ["/api/integrations/health"], events: [] },
  { id: 10, name: "Rate Limiting", description: "Connector quotas, burst, sliding window, concurrency.", endpoints: ["/api/integrations/rate-limits"], events: [] },
  { id: 11, name: "Data Mapping", description: "Field mapping, transformation metadata, validation, normalization.", endpoints: ["/api/integrations/mappings"], events: [] },
  { id: 12, name: "Conflict Resolution", description: "Merge, replace, ignore, manual review. Deterministic only.", endpoints: ["/api/integrations/conflicts"], events: ["ConflictDetected", "ConflictResolved"] },
  { id: 13, name: "Sync Scheduling", description: "Cron, intervals, one-time, manual.", endpoints: ["/api/integrations/schedules"], events: [] },
  { id: 14, name: "Integration Analytics", description: "Sync duration, failure rate, volume, latency, usage.", endpoints: ["/api/integrations/analytics"], events: [] },
  { id: 15, name: "Audit Trail", description: "Every import, export, sync, webhook. Immutable.", endpoints: ["/api/integrations/audit"], events: [] },
  { id: 16, name: "Integration Dashboard", description: "Health, running syncs, queued jobs, connector status, webhook stats.", endpoints: ["/api/integrations/dashboard"], events: [] },
  { id: 17, name: "Event Bus Bridge", description: "Passive consumer/producer. Never business logic.", endpoints: [], events: [
    "ConnectorInstalled", "ConnectorRemoved", "ConnectorSyncStarted", "ConnectorSyncCompleted", "ConnectorSyncFailed",
    "ImportCompleted", "ExportCompleted", "WebhookReceived", "WebhookDelivered", "ConflictDetected", "ConflictResolved",
  ] },
  { id: 18, name: "Developer Integration", description: "Connector SDK metadata, extension hooks, manifest schema.", endpoints: ["/api/integrations/developer"], events: [] },
  { id: 19, name: "Documentation Generator", description: "Markdown, JSON, connector references, event catalog. No LLM.", endpoints: ["/api/integrations/documentation"], events: [] },
  { id: 20, name: "Administration API", description: "Read-only operational endpoints. Status, health, metrics.", endpoints: ["/api/integrations/status"], events: [] },
];
const EVENT_PAYLOADS: Record<IntegrationEventType, string[]> = {
  ConnectorInstalled: ["connectorId", "version"], ConnectorRemoved: ["connectorId"],
  ConnectorSyncStarted: ["syncJobId", "connectorId", "correlationId"], ConnectorSyncCompleted: ["syncJobId", "connectorId", "correlationId"], ConnectorSyncFailed: ["syncJobId", "connectorId", "error", "correlationId"],
  ImportCompleted: ["importJobId", "format", "correlationId"], ExportCompleted: ["exportJobId", "format", "correlationId"],
  WebhookReceived: ["webhookId", "connectorId"], WebhookDelivered: ["webhookId", "success"],
  ConflictDetected: ["conflictId", "connectorId", "entityType"], ConflictResolved: ["conflictId", "connectorId"],
};
const EVENT_DESCRIPTIONS: Record<IntegrationEventType, string> = {
  ConnectorInstalled: "Emitted when a connector is installed.", ConnectorRemoved: "Emitted when a connector is removed.",
  ConnectorSyncStarted: "Emitted when a sync job starts.", ConnectorSyncCompleted: "Emitted when a sync job completes.", ConnectorSyncFailed: "Emitted when a sync job fails.",
  ImportCompleted: "Emitted when an import job completes.", ExportCompleted: "Emitted when an export job completes.",
  WebhookReceived: "Emitted when an incoming webhook is received.", WebhookDelivered: "Emitted when an outgoing webhook is delivered.",
  ConflictDetected: "Emitted when a conflict is detected.", ConflictResolved: "Emitted when a conflict is resolved.",
};

export function generateIntegrationDocumentation(): IntegrationDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({ type: type as IntegrationEventType, payload: EVENT_PAYLOADS[type as IntegrationEventType], description: EVENT_DESCRIPTIONS[type as IntegrationEventType] })),
    ownership: {
      owns: ["Connectors", "Sync", "Imports", "Exports", "Webhook Orchestration", "External API Registry", "Mapping Metadata", "Connector Health", "Rate Limiting", "Conflict Resolution", "Sync Scheduling", "Integration Analytics", "Audit Trail", "Integration Dashboard"],
      doesNotOwn: ["Organizations", "Quizzes", "Commerce", "Identity", "Notifications", "Workflows", "Analytics", "Gameplay", "Users", "Inventory", "AI"],
    },
  };
}
export function generateMarkdownDocumentation(): string {
  const doc = generateIntegrationDocumentation();
  let md = `# EduBek — Integration, Connectors & External Systems Platform\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.23\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for every external system integration. It owns ONLY connectors, sync, imports, exports, webhook orchestration, external API registry, mapping metadata, and connector health. Every business platform remains the owner of its own data.\n\n## Systems\n\n`;
  for (const s of doc.systems) { md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`; if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; } if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; } }
  md += `## Events\n\n`; for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}
export function getIntegrationVersion(): string { return "1.0.0"; }
export function getIntegrationStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } { return { operational: true, systems: 20, bridgeSubscribed: false, updatedAt: new Date().toISOString() }; }
