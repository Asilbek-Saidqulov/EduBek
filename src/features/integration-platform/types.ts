/**
 * EduBek — Integration, Connectors & External Systems Platform types.
 * Phase 6G.23: Single source of truth for external system integrations.
 * Owns ONLY connectors, sync, imports, exports, webhook orchestration, external API registry,
 * mapping metadata, connector health. Never owns business data.
 */

// System 1 — Connector Registry
export type ConnectorType = "education" | "identity" | "productivity" | "data" | "communication" | "assessment" | "custom";
export type ConnectorStatus = "draft" | "installed" | "enabled" | "disabled" | "suspended" | "removed";
export interface ConnectorDefinition {
  id: string; key: string; name: string;
  type: ConnectorType; status: ConnectorStatus;
  version: string; provider: string;
  capabilities: string[]; direction: "inbound" | "outbound" | "bidirectional";
  ownerId: string; signature: string;
  createdAt: string; updatedAt: string; removedAt: string | null;
  metadata: Record<string, unknown>;
}

// System 2 — Connector Lifecycle
export type LifecycleAction = "install" | "enable" | "disable" | "upgrade" | "remove" | "suspend";
export interface ConnectorLifecycleEvent {
  id: string; connectorId: string; action: LifecycleAction;
  fromVersion: string | null; toVersion: string;
  actorId: string; reason: string; occurredAt: string; correlationId: string;
}

// System 3 — Authentication References
export type AuthRefType = "oauth" | "api_key" | "jwt" | "basic" | "secret_ref" | "certificate";
export interface AuthReference {
  id: string; connectorId: string; type: AuthRefType;
  referenceKey: string; scopes: string[];
  expiresAt: string | null; active: boolean;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 4 — Synchronization Engine
export type SyncDirection = "one_way_in" | "one_way_out" | "two_way";
export type SyncMode = "incremental" | "full";
export type SyncStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export interface SyncJob {
  id: string; connectorId: string; direction: SyncDirection; mode: SyncMode;
  status: SyncStatus; entityTypes: string[];
  startedAt: string; completedAt: string | null;
  recordsProcessed: number; recordsSucceeded: number; recordsFailed: number;
  error: string | null; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 5 — Import Platform
export type ImportFormat = "csv" | "excel" | "json" | "ims_cc" | "qti" | "scorm" | "xml";
export type ImportStatus = "queued" | "processing" | "completed" | "failed" | "partial";
export interface ImportJob {
  id: string; connectorId: string | null; format: ImportFormat;
  status: ImportStatus; sourceRef: string;
  totalRecords: number; processedRecords: number; succeededRecords: number; failedRecords: number;
  startedAt: string; completedAt: string | null;
  error: string | null; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 6 — Export Platform
export type ExportFormat = "csv" | "excel" | "json" | "ims_cc" | "qti" | "xml" | "pdf";
export type ExportStatus = "queued" | "processing" | "completed" | "failed" | "streaming";
export interface ExportJob {
  id: string; connectorId: string | null; format: ExportFormat;
  status: ExportStatus; destinationRef: string;
  filter: Record<string, unknown> | null;
  totalRecords: number; exportedRecords: number;
  startedAt: string; completedAt: string | null;
  error: string | null; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 7 — Webhook Platform
export type WebhookDirection = "incoming" | "outgoing";
export type WebhookStatus = "active" | "paused" | "revoked";
export interface IntegrationWebhook {
  id: string; connectorId: string; direction: WebhookDirection;
  url: string; events: string[];
  status: WebhookStatus; signingSecretRef: string;
  retryMax: number; retryBackoffMs: number;
  deliveryCount: number; failureCount: number;
  lastTriggeredAt: string | null; lastStatus: "success" | "failed" | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 8 — External API Registry
export interface ExternalApiDef {
  id: string; connectorId: string; key: string; name: string;
  baseUrl: string; version: string;
  schemas: Record<string, unknown>;
  rateLimitPerMinute: number; rateLimitPerHour: number;
  active: boolean; createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 9 — Connector Health
export type HealthState = "healthy" | "degraded" | "unhealthy" | "unknown";
export interface ConnectorHealth {
  id: string; connectorId: string;
  state: HealthState; latencyMs: number | null;
  availabilityPercent: number;
  failureCount: number; lastFailureAt: string | null;
  retryCount: number; heartbeatAt: string | null;
  checkedAt: string; metadata: Record<string, unknown>;
}

// System 10 — Rate Limiting
export interface ConnectorRateLimit {
  id: string; connectorId: string;
  quotaPerMinute: number; quotaPerHour: number; quotaPerDay: number;
  burstLimit: number; concurrencyLimit: number;
  currentWindow: { minute: number; hour: number; day: number; concurrent: number };
  updatedAt: string;
}

// System 11 — Data Mapping
export type MappingType = "field" | "transform" | "validate" | "normalize";
export interface DataMapping {
  id: string; connectorId: string; name: string;
  sourceSchema: string; targetSchema: string;
  mappings: Array<{ source: string; target: string; transform: string | null; required: boolean }>;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 12 — Conflict Resolution
export type ConflictStrategy = "merge" | "replace" | "ignore" | "manual_review";
export type ConflictStatus = "detected" | "resolved" | "ignored" | "pending_review";
export interface ConflictRecord {
  id: string; connectorId: string; syncJobId: string | null;
  entityType: string; entityId: string;
  strategy: ConflictStrategy; status: ConflictStatus;
  sourceData: Record<string, unknown>; targetData: Record<string, unknown>;
  resolvedData: Record<string, unknown> | null;
  resolvedBy: string | null; resolvedAt: string | null;
  detectedAt: string; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 13 — Sync Scheduling
export type SyncScheduleType = "cron" | "interval" | "one_time" | "manual";
export type SyncScheduleStatus = "active" | "paused" | "completed" | "cancelled";
export interface SyncSchedule {
  id: string; connectorId: string; type: SyncScheduleType;
  cronExpression: string | null; intervalMinutes: number | null;
  scheduledAt: string; nextRunAt: string | null; lastRunAt: string | null;
  status: SyncScheduleStatus; runCount: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 14 — Integration Analytics
export interface IntegrationAnalytics {
  sync: { totalJobs: number; completed: number; failed: number; avgDurationMs: number; totalRecords: number };
  imports: { totalJobs: number; completed: number; failed: number; totalRecords: number };
  exports: { totalJobs: number; completed: number; failed: number; totalRecords: number };
  webhooks: { totalDeliveries: number; successRate: number; totalFailures: number };
  connectors: { total: number; healthy: number; degraded: number; unhealthy: number };
  conflicts: { total: number; resolved: number; pending: number };
  updatedAt: string;
}

// System 15 — Audit Trail
export type AuditCategory = "import" | "export" | "sync" | "webhook" | "connector" | "auth" | "mapping" | "conflict";
export interface IntegrationAuditEntry {
  id: string; category: AuditCategory; action: string;
  connectorId: string | null; actorId: string | null;
  before: Record<string, unknown>; after: Record<string, unknown>;
  reason: string; correlationId: string;
  occurredAt: string; immutable: true;
  metadata: Record<string, unknown>;
}

// System 16 — Integration Dashboard
export interface IntegrationDashboard {
  connectors: { total: number; enabled: number; disabled: number; suspended: number };
  sync: { running: number; queued: number; completed24h: number; failed24h: number };
  imports: { processing: number; completed24h: number; failed24h: number };
  exports: { processing: number; completed24h: number; failed24h: number };
  webhooks: { active: number; deliveries24h: number; failures24h: number };
  health: { healthy: number; degraded: number; unhealthy: number; unknown: number };
  conflicts: { pending: number; resolved24h: number };
  updatedAt: string;
}

// System 17 — Event Bus Bridge
export type IntegrationEventType =
  | "ConnectorInstalled" | "ConnectorRemoved"
  | "ConnectorSyncStarted" | "ConnectorSyncCompleted" | "ConnectorSyncFailed"
  | "ImportCompleted" | "ExportCompleted"
  | "WebhookReceived" | "WebhookDelivered"
  | "ConflictDetected" | "ConflictResolved";

// System 18 — Developer Integration
export interface IntegrationDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean; scope: string }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: IntegrationEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: IntegrationEventType; description: string }>;
  connectorManifestSchema: { fields: string[] };
}

// System 19 — Documentation
export interface IntegrationDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: IntegrationEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}
