/**
 * EduBek — Data Fabric types.
 * Phase 5B.3: Educational Data Fabric, Event Sourcing, CQRS,
 * Real-Time Streaming, Distributed Sync, Global Search Index,
 * Federated Learning, Cross-Institution Benchmarking,
 * Unified Observability, Data Governance, Intelligence Lake.
 */

// Data Fabric Entity
export type FabricEntityType =
  | "student" | "teacher" | "classroom" | "organization" | "resource"
  | "quiz" | "assessment" | "competency" | "certificate" | "marketplace_asset"
  | "ai_session" | "workflow" | "digital_twin" | "extension" | "integration";

export interface DataFabricEntityDto {
  id: string;
  entityType: FabricEntityType;
  entityId: string;
  organizationId: string | null;
  state: Record<string, unknown>;
  versionVector: Record<string, number>;
  lineage: Array<{ source: string; operation: string; timestamp: string }>;
  syncStatus: "in_sync" | "syncing" | "conflict" | "stale";
  lastSyncAt: string | null;
  lifecycle: "active" | "archived" | "deleted";
  createdAt: string;
  updatedAt: string;
}

// Event Store
export interface EventStoreDto {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  payload: Record<string, unknown>;
  metadata: { actorId?: string; source?: string; correlationId?: string; causationId?: string };
  sequence: number;
  occurredAt: string;
}

// Read Models
export type ReadModelType =
  | "dashboard" | "search" | "ai" | "reporting" | "analytics"
  | "recommendations" | "digital_twin" | "benchmark";

export interface ReadModelDto {
  id: string;
  modelType: ReadModelType;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  data: Record<string, unknown>;
  lastSequence: number;
  projectedAt: string;
}

// Sync
export interface SyncCheckpointDto {
  id: string;
  nodeId: string;
  entityType: string;
  lastSequence: number;
  lastSyncAt: string;
  conflicts: Array<{ entityId: string; localVersion: number; remoteVersion: number; resolution: string }>;
  syncMode: "full" | "delta" | "offline_recovery";
}

// Global Search Index
export interface GlobalSearchIndexDto {
  id: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  searchText: string;
  tokens: string[];
  embedding: number[];
  metadata: Record<string, unknown>;
  popularity: number;
  quality: number;
  isMarketplace: boolean;
  isAiGenerated: boolean;
  language: string;
  availableLanguages: string[];
}

export interface GlobalSearchResult {
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  score: number;
  matchedTokens: string[];
  language: string;
  metadata: Record<string, unknown>;
}

// Federated Learning
export interface FederatedLearningJobDto {
  id: string;
  type: string;
  modelType: string;
  status: "pending" | "running" | "completed" | "failed";
  participants: Array<{ orgId: string; contributed: boolean; params?: Record<string, unknown>; quality?: number }>;
  aggregatedParams: Record<string, unknown>;
  round: number;
  privacySettings: { epsilon?: number; delta?: number; mechanism?: string };
  metrics: { accuracy?: number; loss?: number; convergence?: number };
  startedAt: string | null;
  completedAt: string | null;
}

// Benchmarking
export interface BenchmarkReportDto {
  id: string;
  organizationId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  metrics: {
    mastery?: number; curriculumCompletion?: number; engagement?: number;
    aiAdoption?: number; assessmentQuality?: number; teacherWorkload?: number;
    resourceQuality?: number; certificationProgress?: number;
  };
  comparison: { percentile?: number; rank?: number; peerCount?: number };
  peerGroup: { sector?: string; region?: string; size?: string };
  aiSummary: string | null;
}

// Observability
export interface ObservabilityTraceDto {
  id: string;
  traceType: string;
  correlationId: string;
  operation: string;
  organizationId: string | null;
  status: "success" | "error" | "timeout";
  durationMs: number;
  spans: Array<{ spanId: string; parentSpanId?: string; name: string; startMs: number; durationMs: number; status: string; attributes?: Record<string, unknown> }>;
  metrics: { cpuUsage?: number; memoryUsage?: number; requestCount?: number; errorCount?: number };
  logs: Array<{ timestamp: string; level: string; message: string }>;
  dependencies: Array<{ from: string; to: string; type: string; latency: number }>;
  errorMessage: string | null;
  occurredAt: string;
}

// Governance
export interface GovernancePolicyDto {
  id: string;
  type: string;
  name: string;
  description: string | null;
  organizationId: string | null;
  rules: Array<{ field: string; operator: string; value: unknown; action: string }>;
  retentionDays: number | null;
  region: string;
  enabled: boolean;
}

// Intelligence Lake
export interface IntelligenceLakeSnapshotDto {
  id: string;
  type: string;
  organizationId: string | null;
  day: string;
  data: Record<string, unknown>;
  insights: string[];
  forecasts: Array<{ metric: string; horizon: string; predictedValue: number; confidence: number }>;
  trends: Array<{ metric: string; direction: "up" | "down" | "flat"; rate: number; significance: number }>;
}

// Stream Subscriptions
export interface StreamSubscriptionDto {
  id: string;
  subscriberId: string;
  streamType: string;
  filter: Record<string, unknown>;
  deliveryMethod: string;
  deliveryTarget: string | null;
  status: "active" | "paused" | "disabled";
  lastSequence: number;
  totalDelivered: number;
  totalFailed: number;
}

// Fabric overview
export interface FabricOverviewDto {
  totalEntities: number;
  totalEvents: number;
  totalReadModels: number;
  syncStatus: { inSync: number; syncing: number; conflict: number; stale: number };
  searchIndexSize: number;
  activeStreams: number;
  governancePolicies: number;
  intelligenceSnapshots: number;
  benchmarkReports: number;
  federatedJobs: number;
  platformHealth: number;
}
