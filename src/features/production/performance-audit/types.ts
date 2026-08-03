/**
 * EduBek — Production Hardening types.
 *
 * Phase 6A.1: Performance audit, database optimization, cache audit,
 * API performance, background job analysis, resource usage, dependency
 * analysis, startup analysis, reliability analysis, and a weighted
 * production readiness score.
 *
 * Every type is a *diagnostic* surface — this module produces
 * recommendations, never automatic code changes. All endpoints are
 * read-only.
 */

// ===========================================================================
// SYSTEM 1 — Performance Audit
// ===========================================================================

export interface PerformanceAuditReport {
  generatedAt: string;
  /** Slow endpoints (>500ms p95). */
  slowEndpoints: SlowEndpoint[];
  /** Slow Prisma queries (>100ms). */
  slowQueries: SlowQuery[];
  /** Repeated queries (same operation called multiple times per request). */
  repeatedQueries: RepeatedQuery[];
  /** Memory allocation hotspots. */
  memoryHotspots: MemoryHotspot[];
  /** CPU hotspots (functions consuming the most CPU). */
  cpuHotspots: CpuHotspot[];
  /** Async bottlenecks (await chains that block the event loop). */
  asyncBottlenecks: AsyncBottleneck[];
  /** Event loop lag samples. */
  eventLoopLag: EventLoopLagSample[];
  /** Queue latency samples. */
  queueLatency: QueueLatencySample[];
  /** Top recommendations. */
  recommendations: OptimizationRecommendation[];
}

export interface SlowEndpoint {
  route: string;
  method: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  sampleCount: number;
  /** Identified bottleneck stage. */
  bottleneck: "database" | "ai" | "serialization" | "validation" | "network" | "unknown";
  recommendation: string;
}

export interface SlowQuery {
  model: string;
  operation: string;
  p95Ms: number;
  sampleCount: number;
  /** The query fingerprint (anonymized). */
  fingerprint: string;
  recommendation: string;
}

export interface RepeatedQuery {
  model: string;
  operation: string;
  count: number;
  /** Trace id where the repetition was detected. */
  traceId: string;
  recommendation: string;
}

export interface MemoryHotspot {
  module: string;
  allocationBytes: number;
  /** Stack trace snippet. */
  location: string;
  recommendation: string;
}

export interface CpuHotspot {
  module: string;
  cpuMs: number;
  location: string;
  recommendation: string;
}

export interface AsyncBottleneck {
  module: string;
  operation: string;
  awaitDepth: number;
  totalAwaitMs: number;
  recommendation: string;
}

export interface EventLoopLagSample {
  timestamp: string;
  lagMs: number;
}

export interface QueueLatencySample {
  queue: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  depth: number;
}

export interface OptimizationRecommendation {
  id: string;
  category: "performance" | "database" | "cache" | "api" | "job" | "resource" | "dependency" | "startup" | "reliability";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  effort: "low" | "medium" | "high";
  recommendation: string;
}

// ===========================================================================
// SYSTEM 2 — Database Optimization
// ===========================================================================

export interface DatabaseOptimizationReport {
  generatedAt: string;
  /** N+1 query patterns detected. */
  nPlusOneQueries: NPlusOnePattern[];
  /** Queries with missing includes (causing follow-up queries). */
  missingIncludes: MissingIncludePattern[];
  /** Queries with unnecessary eager loading. */
  unnecessaryEagerLoading: EagerLoadingPattern[];
  /** Queries returning large payloads. */
  largePayloads: LargePayloadPattern[];
  /** Queries missing pagination. */
  missingPagination: MissingPaginationPattern[];
  /** Duplicated queries (same result fetched multiple times). */
  duplicatedQueries: DuplicatedQueryPattern[];
  /** Repeated transactions. */
  repeatedTransactions: RepeatedTransactionPattern[];
  /** Inefficient ordering. */
  inefficientOrdering: InefficientOrderingPattern[];
  /** Missing indexes (columns frequently filtered but not indexed). */
  missingIndexes: MissingIndexPattern[];
  /** Expensive filtering. */
  expensiveFiltering: ExpensiveFilteringPattern[];
  recommendations: OptimizationRecommendation[];
}

export interface NPlusOnePattern {
  model: string;
  relation: string;
  occurrences: number;
  traceId: string;
  recommendation: string;
}

export interface MissingIncludePattern {
  model: string;
  relation: string;
  followUpQueries: number;
  recommendation: string;
}

export interface EagerLoadingPattern {
  model: string;
  relations: string[];
  estimatedPayloadBytes: number;
  recommendation: string;
}

export interface LargePayloadPattern {
  model: string;
  estimatedBytes: number;
  rowCount: number;
  recommendation: string;
}

export interface MissingPaginationPattern {
  model: string;
  operation: string;
  rowCount: number;
  recommendation: string;
}

export interface DuplicatedQueryPattern {
  model: string;
  operation: string;
  count: number;
  recommendation: string;
}

export interface RepeatedTransactionPattern {
  module: string;
  transactionCount: number;
  recommendation: string;
}

export interface InefficientOrderingPattern {
  model: string;
  field: string;
  hasIndex: boolean;
  recommendation: string;
}

export interface MissingIndexPattern {
  model: string;
  field: string;
  queryFrequency: number;
  recommendation: string;
}

export interface ExpensiveFilteringPattern {
  model: string;
  filter: string;
  scannedRows: number;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 3 — Cache Optimization
// ===========================================================================

export interface CacheOptimizationReport {
  generatedAt: string;
  /** Current cache statistics (from Cloud Infrastructure cache). */
  cacheStats: CacheStatsSummary;
  /** Candidates for caching (not currently cached but should be). */
  cacheCandidates: CacheCandidate[];
  /** TTL recommendations per namespace. */
  ttlRecommendations: TtlRecommendation[];
  /** Invalidation strategy recommendations. */
  invalidationStrategies: InvalidationStrategy[];
  /** Tag strategy recommendations. */
  tagStrategies: TagStrategy[];
  /** Warmup strategy recommendations. */
  warmupStrategies: WarmupStrategy[];
  /** Cache hit predictions. */
  hitPredictions: HitPrediction[];
  recommendations: OptimizationRecommendation[];
}

export interface CacheStatsSummary {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  avgTtlSeconds: number;
  namespaces: Array<{ namespace: string; entries: number; hits: number; misses: number; hitRate: number }>;
}

export interface CacheCandidate {
  entityType: string;
  reason: string;
  estimatedHitRate: number;
  recommendedTtlSeconds: number;
  estimatedMemoryBytes: number;
}

export interface TtlRecommendation {
  namespace: string;
  currentTtlSeconds: number;
  recommendedTtlSeconds: number;
  reason: string;
}

export interface InvalidationStrategy {
  namespace: string;
  currentStrategy: string;
  recommendedStrategy: string;
  reason: string;
}

export interface TagStrategy {
  namespace: string;
  recommendedTags: string[];
  reason: string;
}

export interface WarmupStrategy {
  namespace: string;
  warmupTrigger: string;
  estimatedWarmupMs: number;
  reason: string;
}

export interface HitPrediction {
  entityType: string;
  predictedHitRate: number;
  confidence: number;
}

// ===========================================================================
// SYSTEM 4 — API Performance
// ===========================================================================

export interface ApiPerformanceReport {
  generatedAt: string;
  /** Endpoint rankings (slowest first). */
  endpointRankings: EndpointRanking[];
  /** Average time breakdown across all endpoints. */
  averageBreakdown: TimeBreakdown;
  recommendations: OptimizationRecommendation[];
}

export interface EndpointRanking {
  route: string;
  method: string;
  sampleCount: number;
  totalTimeMs: number;
  breakdown: TimeBreakdown;
  /** Percentile latency. */
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  rank: number;
}

export interface TimeBreakdown {
  validationMs: number;
  databaseMs: number;
  aiMs: number;
  serializationMs: number;
  networkMs: number;
  totalMs: number;
}

// ===========================================================================
// SYSTEM 5 — Background Job Analyzer
// ===========================================================================

export interface BackgroundJobReport {
  generatedAt: string;
  /** Per-queue summary. */
  queues: JobQueueSummary[];
  /** Per-job-type summary. */
  jobTypes: JobTypeSummary[];
  /** Bottleneck jobs (slowest). */
  bottlenecks: JobBottleneck[];
  /** Retry statistics. */
  retryStats: JobRetryStats;
  recommendations: OptimizationRecommendation[];
}

export interface JobQueueSummary {
  queue: string;
  depth: number;
  processing: number;
  completed24h: number;
  failed24h: number;
  avgDurationMs: number;
  throughputPerMin: number;
}

export interface JobTypeSummary {
  type: string;
  count24h: number;
  avgDurationMs: number;
  p95DurationMs: number;
  failureRate: number;
  retryRate: number;
}

export interface JobBottleneck {
  jobId: string;
  type: string;
  durationMs: number;
  queue: string;
  workerId: string | null;
  recommendation: string;
}

export interface JobRetryStats {
  totalRetries24h: number;
  jobsWithRetries: number;
  avgRetryCount: number;
  maxRetryCount: number;
  deadLetterCount: number;
}

// ===========================================================================
// SYSTEM 6 — Resource Usage
// ===========================================================================

export interface ResourceUsageReport {
  generatedAt: string;
  ram: ResourceMetric;
  cpu: ResourceMetric;
  gpu: ResourceMetric;
  network: ResourceMetric;
  storage: ResourceMetric;
  cache: ResourceMetric;
  aiCredits: ResourceMetric;
  databaseConnections: ResourceMetric;
  workerUtilization: ResourceMetric;
  recommendations: OptimizationRecommendation[];
}

export interface ResourceMetric {
  current: number;
  max: number;
  unit: string;
  utilizationPercent: number;
  trend: "increasing" | "stable" | "decreasing";
  status: "healthy" | "warning" | "critical";
  recommendation: string;
}

// ===========================================================================
// SYSTEM 7 — Dependency Analyzer
// ===========================================================================

export interface DependencyAnalysisReport {
  generatedAt: string;
  /** Circular dependencies detected. */
  circularDependencies: CircularDependency[];
  /** Deep dependency chains. */
  deepChains: DependencyChain[];
  /** Highly-coupled modules. */
  highCoupling: CouplingMetric[];
  /** Unused services (no incoming dependencies). */
  unusedServices: UnusedService[];
  /** Dead modules (no dependencies in or out). */
  deadModules: DeadModule[];
  /** Duplicate utilities (similar function names across modules). */
  duplicateUtilities: DuplicateUtility[];
  recommendations: OptimizationRecommendation[];
}

export interface CircularDependency {
  cycle: string[];
  severity: "low" | "medium" | "high";
  recommendation: string;
}

export interface DependencyChain {
  start: string;
  end: string;
  length: number;
  path: string[];
  recommendation: string;
}

export interface CouplingMetric {
  module: string;
  incomingDependencies: number;
  outgoingDependencies: number;
  couplingScore: number;
  recommendation: string;
}

export interface UnusedService {
  module: string;
  service: string;
  reason: string;
  recommendation: string;
}

export interface DeadModule {
  module: string;
  reason: string;
  recommendation: string;
}

export interface DuplicateUtility {
  name: string;
  modules: string[];
  recommendation: string;
}

// ===========================================================================
// SYSTEM 8 — Startup Analyzer
// ===========================================================================

export interface StartupAnalysisReport {
  generatedAt: string;
  totalStartupMs: number;
  /** Per-phase startup timeline. */
  timeline: StartupPhase[];
  /** Slowest initializations. */
  slowestInitializations: StartupPhase[];
  recommendations: OptimizationRecommendation[];
}

export interface StartupPhase {
  phase: string;
  durationMs: number;
  /** Sub-phases (if any). */
  subPhases: Array<{ name: string; durationMs: number }>;
  recommendation: string;
}

// ===========================================================================
// SYSTEM 9 — Reliability Analyzer
// ===========================================================================

export interface ReliabilityReport {
  generatedAt: string;
  /** Retry policy coverage. */
  retryPolicyCoverage: ReliabilityCoverage;
  /** Timeout coverage. */
  timeoutCoverage: ReliabilityCoverage;
  /** Circuit breaker coverage. */
  circuitBreakerCoverage: ReliabilityCoverage;
  /** Distributed lock usage. */
  distributedLockUsage: ReliabilityCoverage;
  /** Idempotency coverage. */
  idempotencyCoverage: ReliabilityCoverage;
  /** Error recovery mechanisms. */
  errorRecovery: ErrorRecoveryReport;
  /** Queue recovery mechanisms. */
  queueRecovery: QueueRecoveryReport;
  /** Missing protection report. */
  missingProtections: MissingProtection[];
  recommendations: OptimizationRecommendation[];
}

export interface ReliabilityCoverage {
  totalOperations: number;
  protectedOperations: number;
  coveragePercent: number;
  unprotectedOperations: string[];
}

export interface ErrorRecoveryReport {
  errorPatterns24h: Array<{ error: string; count: number; recoveredCount: number }>;
  recoveryRate: number;
  recommendation: string;
}

export interface QueueRecoveryReport {
  queuesWithDeadLetter: string[];
  queuesWithoutDeadLetter: string[];
  recommendation: string;
}

export interface MissingProtection {
  operation: string;
  module: string;
  missingProtections: string[];
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

// ===========================================================================
// SYSTEM 10 — Production Readiness Score
// ===========================================================================

export interface ProductionReadinessScore {
  generatedAt: string;
  /** Per-dimension scores (0..100). */
  dimensions: Array<{
    name: string;
    score: number;
    weight: number;
    weightedScore: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  /** Overall weighted score (0..100). */
  overallScore: number;
  /** Letter grade (A+ to F). */
  grade: string;
  /** Top strengths. */
  topStrengths: string[];
  /** Top weaknesses. */
  topWeaknesses: string[];
  /** Priority recommendations. */
  priorityRecommendations: Array<{ recommendation: string; impact: number; effort: number; priority: number }>;
}

// ===========================================================================
// Unified audit result
// ===========================================================================

export interface FullAuditReport {
  generatedAt: string;
  performance: PerformanceAuditReport;
  database: DatabaseOptimizationReport;
  cache: CacheOptimizationReport;
  api: ApiPerformanceReport;
  jobs: BackgroundJobReport;
  resources: ResourceUsageReport;
  dependencies: DependencyAnalysisReport;
  startup: StartupAnalysisReport;
  reliability: ReliabilityReport;
  readiness: ProductionReadinessScore;
}
