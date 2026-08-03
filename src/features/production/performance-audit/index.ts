/**
 * EduBek — Production performance-audit barrel export.
 *
 * Phase 6A.1: Production Hardening, Performance Audit & Infrastructure
 * Optimization.
 *
 * 10 systems:
 *   1. Global Performance Audit (performance-profiler)
 *   2. Database Optimization Layer (database-analyzer)
 *   3. Cache Optimization (cache-analyzer)
 *   4. API Performance Analyzer (api-analyzer)
 *   5. Background Job Analyzer (job-analyzer)
 *   6. Resource Usage Analyzer (resource-analyzer)
 *   7. Dependency Analyzer (dependency-analyzer)
 *   8. Startup Analyzer (startup-analyzer)
 *   9. Reliability Analyzer (reliability-analyzer)
 *  10. Production Readiness Score (readiness-score)
 *
 * All endpoints are READ-ONLY diagnostics. This module produces
 * recommendations, never automatic code changes. It reuses every
 * existing subsystem (Platform Orchestrator, Platform Intelligence,
 * Cloud Infrastructure, Data Fabric, Observability) without
 * duplicating monitoring.
 */

// Service
export {
  generatePerformanceAudit, recordEndpointTiming, recordQueryTiming, recordEventLoopLag,
  generateDatabaseReport,
  generateCacheReport,
  generateApiReport,
  generateJobReport,
  generateResourceReport,
  generateDependencyReport,
  generateStartupReport, recordStartupPhase,
  generateReliabilityReport,
  generateReadinessScore,
  generateFullAudit,
} from "./service";

// Types
export type {
  PerformanceAuditReport, SlowEndpoint, SlowQuery, RepeatedQuery,
  MemoryHotspot, CpuHotspot, AsyncBottleneck, EventLoopLagSample,
  QueueLatencySample, OptimizationRecommendation,
  DatabaseOptimizationReport, NPlusOnePattern, MissingIncludePattern,
  EagerLoadingPattern, LargePayloadPattern, MissingPaginationPattern,
  DuplicatedQueryPattern, RepeatedTransactionPattern, InefficientOrderingPattern,
  MissingIndexPattern, ExpensiveFilteringPattern,
  CacheOptimizationReport, CacheStatsSummary, CacheCandidate,
  TtlRecommendation, InvalidationStrategy, TagStrategy,
  WarmupStrategy, HitPrediction,
  ApiPerformanceReport, EndpointRanking, TimeBreakdown,
  BackgroundJobReport, JobQueueSummary, JobTypeSummary,
  JobBottleneck, JobRetryStats,
  ResourceUsageReport, ResourceMetric,
  DependencyAnalysisReport, CircularDependency, DependencyChain,
  CouplingMetric, UnusedService, DeadModule, DuplicateUtility,
  StartupAnalysisReport, StartupPhase,
  ReliabilityReport, ReliabilityCoverage, ErrorRecoveryReport,
  QueueRecoveryReport, MissingProtection,
  ProductionReadinessScore,
  FullAuditReport,
} from "./types";
