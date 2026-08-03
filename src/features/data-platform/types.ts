/**
 * EduBek — Data Platform, Lakehouse & Business Intelligence types.
 * Phase 6G.25: Single source of truth for analytical data across EduBek.
 * Owns ONLY analytical copies, datasets, pipelines, warehouse metadata, reporting,
 * semantic models, BI, and enterprise reporting. Never owns operational data.
 * Never writes back into operational platforms. Never executes business logic.
 */

// System 1 — Dataset Registry
export type DatasetCategory = "raw" | "curated" | "aggregated" | "reference" | "semantic" | "operational" | "custom";
export type DatasetStatus = "draft" | "active" | "deprecated" | "archived";
export interface DatasetDefinition {
  id: string; key: string; name: string;
  category: DatasetCategory; status: DatasetStatus;
  ownerId: string; sourcePlatforms: string[];
  version: number; schema: Record<string, unknown>;
  createdAt: string; updatedAt: string;
  archivedAt: string | null;
  metadata: Record<string, unknown>;
}

// System 2 — Data Catalog
export interface CatalogEntry {
  id: string; datasetId: string; name: string; description: string;
  tags: string[]; classifications: string[];
  searchable: boolean; owner: string;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 3 — Data Lake Metadata
export type LakeFormat = "parquet" | "json" | "csv" | "avro" | "orc" | "delta";
export interface LakePartition {
  id: string; datasetId: string;
  partitionKey: string; partitionValue: string;
  format: LakeFormat; sizeBytes: number; recordCount: number;
  createdAt: string;
}
export interface LakeSnapshotMeta {
  id: string; datasetId: string; type: "incremental" | "full";
  partitionIds: string[]; sizeBytes: number;
  createdAt: string; retentionDays: number;
}
export interface LakeRetentionPolicy {
  id: string; datasetId: string; retentionDays: number;
  snapshotRetentionDays: number; partitionRetentionDays: number;
  createdAt: string; updatedAt: string;
}

// System 4 — Data Warehouse Metadata
export type WarehouseObjectType = "table" | "view" | "materialized_view";
export type WarehouseRefreshStatus = "pending" | "running" | "completed" | "failed";
export interface WarehouseObject {
  id: string; datasetId: string; name: string;
  type: WarehouseObjectType; schema: string;
  columns: Array<{ name: string; type: string; nullable: boolean }>;
  version: number; lastRefreshedAt: string | null;
  createdAt: string; updatedAt: string;
}
export interface WarehouseRefreshLog {
  id: string; objectId: string; status: WarehouseRefreshStatus;
  startedAt: string; completedAt: string | null;
  rowsAffected: number; durationMs: number | null;
  error: string | null;
}

// System 5 — ETL Engine
export type ETLStatus = "pending" | "extracting" | "transforming" | "loading" | "completed" | "failed";
export interface ETLJob {
  id: string; datasetId: string; name: string;
  sourceRef: string; transformRef: string; targetRef: string;
  status: ETLStatus; schedule: string | null;
  lastRunAt: string | null; rowsProcessed: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 6 — ELT Engine
export type ELTStatus = "pending" | "running" | "completed" | "failed";
export interface ELTJob {
  id: string; datasetId: string; name: string;
  sql: string; dependencies: string[];
  status: ELTStatus;
  startedAt: string; completedAt: string | null;
  rowsAffected: number; error: string | null;
  createdAt: string; updatedAt: string;
}

// System 7 — Pipeline Orchestration
export type PipelineStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
export interface PipelineStep {
  id: string; name: string; type: "etl" | "elt" | "sql" | "python" | "custom";
  dependsOn: string[]; config: Record<string, unknown>;
  retryMax: number; timeoutMs: number | null;
}
export interface Pipeline {
  id: string; name: string; datasetId: string | null;
  steps: PipelineStep[]; status: PipelineStatus;
  schedule: string | null; lastRunAt: string | null;
  retryCount: number; maxRetries: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}
export interface PipelineRun {
  id: string; pipelineId: string;
  status: PipelineStatus; stepResults: Array<{ stepId: string; status: string; startedAt: string; completedAt: string | null }>;
  startedAt: string; completedAt: string | null;
  error: string | null; correlationId: string;
}

// System 8 — Snapshot Platform
export type SnapshotType = "incremental" | "full" | "point_in_time";
export type SnapshotStatus = "created" | "restoring" | "restored" | "expired" | "failed";
export interface SnapshotRecord {
  id: string; datasetId: string; type: SnapshotType;
  status: SnapshotStatus; version: number;
  sizeBytes: number; recordCount: number;
  createdAt: string; expiresAt: string | null;
  restoredAt: string | null;
  correlationId: string;
}

// System 9 — Fact Registry
export type FactGrain = "daily" | "hourly" | "event" | "transaction" | "session";
export interface FactDefinition {
  id: string; key: string; name: string;
  datasetId: string; grain: FactGrain;
  measures: Array<{ name: string; aggregation: "sum" | "count" | "avg" | "min" | "max" | "distinct"; column: string }>;
  dimensionKeys: string[];
  version: number; active: boolean;
  createdAt: string; updatedAt: string;
}

// System 10 — Dimension Registry
export type SCDType = "type1" | "type2" | "type3";
export interface DimensionDefinition {
  id: string; key: string; name: string;
  datasetId: string; attributes: string[];
  hierarchies: Array<{ name: string; levels: string[] }>;
  scdType: SCDType;
  version: number; active: boolean;
  createdAt: string; updatedAt: string;
}

// System 11 — Semantic Layer
export interface SemanticMetric {
  id: string; key: string; name: string; description: string;
  factKey: string; calculation: string;
  businessName: string; category: string;
  active: boolean; version: number;
  createdAt: string; updatedAt: string;
}

// System 12 — KPI Registry
export type KPICategory = "institution" | "gaming" | "learning" | "commerce" | "operational";
export interface KPIDefinition {
  id: string; key: string; name: string; description: string;
  category: KPICategory; metricKey: string;
  target: number; unit: string;
  owner: string; active: boolean;
  createdAt: string; updatedAt: string;
}
export interface KPIResult {
  id: string; kpiId: string; value: number;
  period: string; target: number;
  achieved: boolean; calculatedAt: string;
  correlationId: string;
}

// System 13 — Business Reports
export type ReportFormat = "pdf" | "excel" | "html" | "json" | "csv";
export type ReportStatus = "draft" | "active" | "deprecated";
export interface ReportDefinition {
  id: string; key: string; name: string; description: string;
  semanticMetricKeys: string[]; parameters: Array<{ key: string; type: string; required: boolean; defaultValue: unknown }>;
  format: ReportFormat; status: ReportStatus;
  version: number; owner: string;
  createdAt: string; updatedAt: string;
}
export interface ReportExecution {
  id: string; reportId: string;
  status: "queued" | "running" | "completed" | "failed";
  parameters: Record<string, unknown>;
  format: ReportFormat; outputRef: string | null;
  startedAt: string; completedAt: string | null;
  error: string | null; correlationId: string;
}

// System 14 — Dashboard Registry
export type WidgetType = "chart" | "table" | "kpi" | "gauge" | "text" | "filter" | "image";
export interface DashboardWidget {
  id: string; type: WidgetType; title: string;
  config: Record<string, unknown>; position: { x: number; y: number; w: number; h: number };
}
export interface DashboardDefinition {
  id: string; key: string; name: string; description: string;
  widgets: DashboardWidget[];
  owner: string; audience: string[];
  active: boolean; version: number;
  createdAt: string; updatedAt: string;
}

// System 15 — Scheduled Reporting
export type ScheduleType = "cron" | "interval" | "one_time";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export interface ReportSchedule {
  id: string; reportId: string;
  type: ScheduleType; cronExpression: string | null; intervalMinutes: number | null;
  nextRunAt: string | null; lastRunAt: string | null;
  status: SubscriptionStatus; runCount: number;
  createdAt: string; updatedAt: string;
}
export interface ReportSubscription {
  id: string; scheduleId: string; userId: string;
  deliveryMethod: "email" | "slack" | "webhook" | "dashboard";
  deliveryRef: string; status: SubscriptionStatus;
  createdAt: string; updatedAt: string;
}

// System 16 — Data Export Platform
export type ExportFormat = "csv" | "excel" | "json" | "parquet";
export type ExportStatus = "queued" | "processing" | "completed" | "failed" | "streaming";
export interface DataExport {
  id: string; datasetId: string; format: ExportFormat;
  status: ExportStatus; filter: Record<string, unknown> | null;
  totalRecords: number; exportedRecords: number;
  destinationRef: string;
  startedAt: string; completedAt: string | null;
  error: string | null; correlationId: string;
}

// System 17 — Data Lineage
export type LineageNodeType = "source" | "pipeline" | "dataset" | "report" | "dashboard" | "kpi" | "export";
export interface LineageNode {
  id: string; type: LineageNodeType; refId: string; name: string;
}
export interface LineageEdge {
  id: string; fromNodeId: string; toNodeId: string;
  relationship: "produces" | "consumes" | "derives" | "feeds";
}

// System 18 — Data Quality
export type QualityDimension = "completeness" | "freshness" | "duplicates" | "integrity" | "validation" | "accuracy";
export type QualityStatus = "pass" | "warn" | "fail" | "skip";
export interface QualityRule {
  id: string; datasetId: string; name: string;
  dimension: QualityDimension; expression: string;
  threshold: number; active: boolean;
  createdAt: string; updatedAt: string;
}
export interface QualityResult {
  id: string; ruleId: string; datasetId: string;
  status: QualityStatus; value: number; threshold: number;
  checkedAt: string; error: string | null;
}

// System 19 — Governance Platform
export type GovernanceClassification = "public" | "internal" | "confidential" | "restricted" | "pii" | "phi";
export type GovernanceStatus = "pending" | "approved" | "rejected" | "review";
export interface GovernancePolicy {
  id: string; datasetId: string;
  classification: GovernanceClassification;
  retentionDays: number; owner: string;
  complianceTags: string[];
  status: GovernanceStatus;
  approvedBy: string | null; approvedAt: string | null;
  createdAt: string; updatedAt: string;
}

// System 20 — BI Analytics
export interface BIAnalytics {
  queries: { total: number; avgDurationMs: number; byDataset: Record<string, number> };
  dashboards: { totalViews: number; byDashboard: Record<string, number> };
  pipelines: { totalRuns: number; successRate: number; avgDurationMs: number };
  storage: { totalBytes: number; byFormat: Record<string, number> };
  exports: { total: number; byFormat: Record<string, number> };
  updatedAt: string;
}

// System 21 — Developer Integration
export interface DeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean; scope: string }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: DataEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: DataEventType; description: string }>;
  warehouseSchemas: Array<{ name: string; columns: string[] }>;
}

// System 22 — Administration Dashboard
export interface AdminDashboard {
  datasets: { total: number; active: number; deprecated: number; archived: number };
  pipelines: { total: number; running: number; completed24h: number; failed24h: number };
  warehouse: { objects: number; lastRefresh: string | null };
  quality: { rules: number; passRate: number; failing: number };
  governance: { pending: number; approved: number; rejected: number };
  kpis: { total: number; achieved: number; pending: number };
  reports: { total: number; executed24h: number };
  dashboards: { total: number; active: number };
  updatedAt: string;
}

// System 23 — Event Bus Bridge
export type DataEventType =
  | "DatasetCreated" | "DatasetUpdated"
  | "PipelineCompleted" | "PipelineFailed"
  | "SnapshotCreated"
  | "ReportGenerated" | "DashboardPublished"
  | "DataQualityFailed" | "KPICalculated"
  | "WarehouseRefreshed";

// System 24 — Documentation
export interface DataPlatformDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: DataEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}
