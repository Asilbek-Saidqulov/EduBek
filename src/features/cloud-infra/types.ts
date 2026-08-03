/**
 * EduBek — Cloud Infrastructure types.
 * Phase 5C.1: Distributed Task Engine, AI Inference Gateway,
 * Workflow Scheduler, Resource Manager, Cache Layer, Media/Document
 * Pipelines, Secrets, Observability, Cloud Operations Center.
 */

export type CloudJobType =
  | "ai_generation" | "embedding" | "curriculum_analysis" | "grading"
  | "report" | "recommendation_refresh" | "graph_rebuild" | "notification"
  | "import" | "export" | "media_processing" | "document_processing" | "custom";

export type JobQueue = "high_priority" | "default" | "low_priority" | "ai" | "media" | "documents";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "dead_letter";

export interface CloudJobDto {
  id: string; type: CloudJobType; queue: JobQueue; priority: number;
  payload: Record<string, unknown>; status: JobStatus;
  workerId: string | null; progress: number; result: unknown;
  errorMessage: string | null; errorStack: string | null;
  maxRetries: number; retryCount: number; retryDelayMs: number;
  scheduledFor: string | null; timeoutMs: number;
  requirements: Record<string, unknown>;
  organizationId: string | null; createdBy: string | null;
  startedAt: string | null; completedAt: string | null;
  createdAt: string; updatedAt: string;
}

export type InferenceProvider = "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "mistral" | "local" | "edubek";

export interface InferenceRequestDto {
  id: string; provider: InferenceProvider; model: string; requestType: string;
  input: Record<string, unknown>; output: Record<string, unknown> | null;
  status: "pending" | "running" | "completed" | "failed" | "fallback";
  fallbackProvider: string | null; fallbackReason: string | null;
  costCredits: number; latencyMs: number; tokenUsage: Record<string, number>;
  organizationId: string | null; userId: string | null; occurredAt: string;
}

export interface ScheduledWorkflowDto {
  id: string; name: string; description: string | null;
  scheduleType: "nightly" | "weekly" | "semester" | "cron" | "delayed" | "recurring";
  cronExpression: string | null; workflowType: string;
  workflowParams: Record<string, unknown>;
  dependencies: Array<{ jobId: string; dependsOn: string[] }>;
  status: "active" | "paused" | "completed" | "failed";
  lastExecutedAt: string | null; lastExecutionStatus: string | null;
  nextRunAt: string | null; organizationId: string | null; createdBy: string;
}

export interface ResourceAllocationDto {
  id: string; resourceType: string; allocatedTo: string; allocatedToType: string;
  amount: number; unit: string; organizationId: string | null;
  status: "active" | "released" | "expired"; allocatedAt: string; releasedAt: string | null;
}

export interface CacheEntryDto {
  id: string; namespace: string; key: string; value: Record<string, unknown>;
  ttlSeconds: number; compression: string; tags: string[];
  hitCount: number; missCount: number; lastAccessedAt: string | null; expiresAt: string;
}

export interface MediaJobDto {
  id: string; mediaType: string; operation: string; inputUrl: string; outputUrl: string | null;
  status: "queued" | "processing" | "completed" | "failed"; progress: number;
  metadata: Record<string, unknown>; errorMessage: string | null;
  organizationId: string | null; cloudJobId: string | null;
}

export interface DocumentJobDto {
  id: string; documentType: string; inputUrl: string;
  extractedContent: Record<string, unknown>;
  status: "queued" | "processing" | "completed" | "failed"; progress: number;
  pageCount: number | null; errorMessage: string | null;
  organizationId: string | null; cloudJobId: string | null;
}

export interface SecretDto {
  id: string; type: string; name: string;
  organizationId: string | null;
  rotationEnabled: boolean; rotationDays: number | null;
  lastRotatedAt: string | null; nextRotationAt: string | null;
  createdBy: string; lastAccessedBy: string | null; lastAccessedAt: string | null;
}

export interface InfraMetricDto {
  id: string; source: string; metric: string; value: number; unit: string;
  labels: Record<string, unknown>; timestamp: string;
}

export interface CloudWorkerDto {
  id: string; type: string; name: string; status: "idle" | "busy" | "offline" | "draining";
  capabilities: string[]; resources: Record<string, unknown>;
  currentLoad: Record<string, unknown>;
  totalJobsCompleted: number; totalJobsFailed: number; uptimeSeconds: number;
  lastHeartbeatAt: string;
}

export interface CostSnapshotDto {
  id: string; day: string; organizationId: string | null;
  breakdown: Record<string, number>; totalCredits: number; estimatedUsd: number;
  byService: Array<{ service: string; credits: number; usd: number }>;
}

export interface CloudOperationsCenterDto {
  clusterHealth: { status: "healthy" | "degraded" | "down"; score: number };
  queues: Array<{ name: string; depth: number; processing: number; completed: number; failed: number }>;
  workers: { total: number; idle: number; busy: number; offline: number };
  aiProviders: Array<{ provider: string; status: string; avgLatencyMs: number; totalRequests: number }>;
  cache: { totalEntries: number; hitRate: number; totalHits: number; totalMisses: number };
  storage: { usedMb: number; quotaMb: number };
  costs: { todayCredits: number; monthCredits: number; estimatedUsd: number };
  activeWorkflows: number;
  generatedAt: string;
}
