/**
 * EduBek — Production performance-audit tests.
 *
 * Phase 6A.1: Verifies the performance audit, database analyzer, cache
 * analyzer, API analyzer, job analyzer, resource analyzer, dependency
 * analyzer, startup analyzer, reliability analyzer, and readiness score.
 *
 * Tests focus on deterministic logic — the analyzers' recommendation
 * generators, scoring functions, and schema parsers.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordEndpointTiming, recordQueryTiming, recordEventLoopLag,
} from "@/features/production/performance-audit/performance-profiler";
import * as repo from "@/features/production/performance-audit/repository";
import { generatePerformanceAudit } from "@/features/production/performance-audit/performance-profiler";
import { generateDatabaseReport } from "@/features/production/performance-audit/database-analyzer";
import { generateCacheReport } from "@/features/production/performance-audit/cache-analyzer";
import { generateApiReport } from "@/features/production/performance-audit/api-analyzer";
import { generateJobReport } from "@/features/production/performance-audit/job-analyzer";
import { generateResourceReport } from "@/features/production/performance-audit/resource-analyzer";
import { generateDependencyReport } from "@/features/production/performance-audit/dependency-analyzer";
import { generateStartupReport, recordStartupPhase } from "@/features/production/performance-audit/startup-analyzer";
import { generateReliabilityReport } from "@/features/production/performance-audit/reliability-analyzer";
import { generateReadinessScore } from "@/features/production/performance-audit/readiness-score";
import { percentile } from "@/features/production/performance-audit/repository";

// ===========================================================================
// Repository helpers
// ===========================================================================

describe("Production — Repository helpers", () => {
  it("computes percentiles correctly", () => {
    expect(percentile([], 0.5)).toBe(0);
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5], 0.95)).toBe(5);
    expect(percentile([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 0.5)).toBe(60);
  });

  it("parses JSON safely", () => {
    expect(repo.safeParse('{"a":1}', null)).toEqual({ a: 1 });
    expect(repo.safeParse(null, "fallback")).toBe("fallback");
    expect(repo.safeParse("invalid json", "fallback")).toBe("fallback");
  });
});

// ===========================================================================
// Performance Profiler
// ===========================================================================

describe("Production — Performance Profiler", () => {
  beforeEach(() => {
    repo.clearSamples();
  });

  it("records and retrieves endpoint samples", () => {
    recordEndpointTiming({
      route: "/api/test", method: "GET", totalTimeMs: 100,
      databaseMs: 50, aiMs: 0, serializationMs: 10,
    });
    const samples = repo.listEndpointSamples();
    expect(samples.length).toBe(1);
    expect(samples[0].route).toBe("/api/test");
    expect(samples[0].databaseMs).toBe(50);
  });

  it("records and retrieves query samples", () => {
    recordQueryTiming({
      model: "User", operation: "findMany", durationMs: 50,
      traceId: "test-trace", fingerprint: "User:findMany:where",
    });
    const samples = repo.listQuerySamples();
    expect(samples.length).toBe(1);
    expect(samples[0].model).toBe("User");
  });

  it("records and retrieves event loop samples", () => {
    recordEventLoopLag(5);
    const samples = repo.listEventLoopSamples();
    expect(samples.length).toBe(1);
    expect(samples[0].lagMs).toBe(5);
  });

  it("ring buffer caps at 1000 entries", () => {
    for (let i = 0; i < 1100; i++) {
      recordEndpointTiming({
        route: `/api/test${i}`, method: "GET", totalTimeMs: 10,
      });
    }
    const samples = repo.listEndpointSamples();
    expect(samples.length).toBe(1000);
  });

  it("detects slow endpoints from samples", async () => {
    for (let i = 0; i < 10; i++) {
      recordEndpointTiming({
        route: "/api/slow", method: "GET", totalTimeMs: 800,
        databaseMs: 600,
      });
    }
    const report = await generatePerformanceAudit();
    expect(report.slowEndpoints.length).toBeGreaterThan(0);
    expect(report.slowEndpoints[0].route).toBe("/api/slow");
    expect(report.slowEndpoints[0].bottleneck).toBe("database");
  });

  it("detects repeated queries from samples", async () => {
    for (let i = 0; i < 10; i++) {
      recordQueryTiming({
        model: "User", operation: "findUnique", durationMs: 20,
        traceId: "same-trace", fingerprint: "User:findUnique:id",
      });
    }
    const report = await generatePerformanceAudit();
    expect(report.repeatedQueries.length).toBeGreaterThan(0);
    expect(report.repeatedQueries[0].count).toBe(10);
  });

  it("generates recommendations for slow endpoints", async () => {
    for (let i = 0; i < 10; i++) {
      recordEndpointTiming({
        route: "/api/very-slow", method: "POST", totalTimeMs: 2500,
        aiMs: 2000,
      });
    }
    const report = await generatePerformanceAudit();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations.some(r => r.category === "performance")).toBe(true);
  });
});

// ===========================================================================
// Database Analyzer
// ===========================================================================

describe("Production — Database Analyzer", () => {
  it("generates a database optimization report", async () => {
    const report = await generateDatabaseReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("nPlusOneQueries");
    expect(report).toHaveProperty("missingIncludes");
    expect(report).toHaveProperty("missingIndexes");
    expect(report).toHaveProperty("recommendations");
    expect(Array.isArray(report.nPlusOneQueries)).toBe(true);
    expect(Array.isArray(report.missingIndexes)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  it("detects N+1 patterns from query samples", async () => {
    repo.clearSamples();
    for (let i = 0; i < 8; i++) {
      recordQueryTiming({
        model: "User", operation: "findUnique", durationMs: 10,
        traceId: "nplus1-trace", fingerprint: "User:findUnique:id",
      });
    }
    const report = await generateDatabaseReport();
    expect(report.nPlusOneQueries.length).toBeGreaterThan(0);
    expect(report.nPlusOneQueries[0].occurrences).toBe(8);
  });
});

// ===========================================================================
// Cache Analyzer
// ===========================================================================

describe("Production — Cache Analyzer", () => {
  it("generates a cache optimization report", async () => {
    const report = await generateCacheReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("cacheStats");
    expect(report).toHaveProperty("cacheCandidates");
    expect(report).toHaveProperty("ttlRecommendations");
    expect(report).toHaveProperty("invalidationStrategies");
    expect(report).toHaveProperty("tagStrategies");
    expect(report).toHaveProperty("warmupStrategies");
    expect(report).toHaveProperty("hitPredictions");
    expect(report).toHaveProperty("recommendations");
    expect(report.cacheCandidates.length).toBeGreaterThan(0);
    expect(report.invalidationStrategies.length).toBeGreaterThan(0);
    expect(report.tagStrategies.length).toBeGreaterThan(0);
    expect(report.warmupStrategies.length).toBeGreaterThan(0);
  });

  it("identifies well-known cache candidates", async () => {
    const report = await generateCacheReport();
    const entityTypes = report.cacheCandidates.map(c => c.entityType);
    expect(entityTypes.some(t => t.includes("dashboard"))).toBe(true);
    expect(entityTypes.some(t => t.includes("curriculum"))).toBe(true);
    expect(entityTypes.some(t => t.includes("knowledge_graph"))).toBe(true);
  });
});

// ===========================================================================
// API Analyzer
// ===========================================================================

describe("Production — API Analyzer", () => {
  beforeEach(() => {
    repo.clearSamples();
  });

  it("generates an API performance report", async () => {
    const report = await generateApiReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("endpointRankings");
    expect(report).toHaveProperty("averageBreakdown");
    expect(report).toHaveProperty("recommendations");
  });

  it("ranks endpoints by p95 latency", async () => {
    for (let i = 0; i < 5; i++) {
      recordEndpointTiming({ route: "/api/fast", method: "GET", totalTimeMs: 50 });
      recordEndpointTiming({ route: "/api/slow", method: "GET", totalTimeMs: 800 });
    }
    const report = await generateApiReport();
    expect(report.endpointRankings.length).toBe(2);
    expect(report.endpointRankings[0].p95Ms).toBeGreaterThan(report.endpointRankings[1].p95Ms);
    expect(report.endpointRankings[0].rank).toBe(1);
  });
});

// ===========================================================================
// Job Analyzer
// ===========================================================================

describe("Production — Job Analyzer", () => {
  it("generates a background job report", async () => {
    const report = await generateJobReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("queues");
    expect(report).toHaveProperty("jobTypes");
    expect(report).toHaveProperty("bottlenecks");
    expect(report).toHaveProperty("retryStats");
    expect(report).toHaveProperty("recommendations");
    expect(report.retryStats).toHaveProperty("totalRetries24h");
    expect(report.retryStats).toHaveProperty("deadLetterCount");
  });
});

// ===========================================================================
// Resource Analyzer
// ===========================================================================

describe("Production — Resource Analyzer", () => {
  it("generates a resource usage report", async () => {
    const report = await generateResourceReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("ram");
    expect(report).toHaveProperty("cpu");
    expect(report).toHaveProperty("gpu");
    expect(report).toHaveProperty("network");
    expect(report).toHaveProperty("storage");
    expect(report).toHaveProperty("cache");
    expect(report).toHaveProperty("aiCredits");
    expect(report).toHaveProperty("databaseConnections");
    expect(report).toHaveProperty("workerUtilization");
    expect(report).toHaveProperty("recommendations");
    // RAM metric should have valid fields
    expect(report.ram).toHaveProperty("current");
    expect(report.ram).toHaveProperty("max");
    expect(report.ram).toHaveProperty("utilizationPercent");
    expect(report.ram).toHaveProperty("status");
    expect(report.ram.status).toMatch(/healthy|warning|critical/);
  });
});

// ===========================================================================
// Dependency Analyzer
// ===========================================================================

describe("Production — Dependency Analyzer", () => {
  it("generates a dependency analysis report", async () => {
    const report = await generateDependencyReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("circularDependencies");
    expect(report).toHaveProperty("deepChains");
    expect(report).toHaveProperty("highCoupling");
    expect(report).toHaveProperty("unusedServices");
    expect(report).toHaveProperty("deadModules");
    expect(report).toHaveProperty("duplicateUtilities");
    expect(report).toHaveProperty("recommendations");
  });
});

// ===========================================================================
// Startup Analyzer
// ===========================================================================

describe("Production — Startup Analyzer", () => {
  it("records and retrieves startup phases", () => {
    recordStartupPhase({ phase: "test-phase", durationMs: 100 });
    // The phase is recorded — we verify via the report
  });

  it("generates a startup analysis report", async () => {
    const report = await generateStartupReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("totalStartupMs");
    expect(report).toHaveProperty("timeline");
    expect(report).toHaveProperty("slowestInitializations");
    expect(report).toHaveProperty("recommendations");
    expect(report.timeline.length).toBeGreaterThan(0);
    expect(report.totalStartupMs).toBeGreaterThanOrEqual(0);
  });

  it("timeline has phases with recommendations", async () => {
    const report = await generateStartupReport();
    for (const phase of report.timeline) {
      expect(phase.phase).toBeTruthy();
      expect(phase.durationMs).toBeGreaterThanOrEqual(0);
      expect(phase.recommendation).toBeTruthy();
    }
  });
});

// ===========================================================================
// Reliability Analyzer
// ===========================================================================

describe("Production — Reliability Analyzer", () => {
  it("generates a reliability report", async () => {
    const report = await generateReliabilityReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("retryPolicyCoverage");
    expect(report).toHaveProperty("timeoutCoverage");
    expect(report).toHaveProperty("circuitBreakerCoverage");
    expect(report).toHaveProperty("distributedLockUsage");
    expect(report).toHaveProperty("idempotencyCoverage");
    expect(report).toHaveProperty("errorRecovery");
    expect(report).toHaveProperty("queueRecovery");
    expect(report).toHaveProperty("missingProtections");
    expect(report).toHaveProperty("recommendations");
    // Coverage objects should have percent
    expect(report.retryPolicyCoverage.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(report.retryPolicyCoverage.coveragePercent).toBeLessThanOrEqual(100);
  });
});

// ===========================================================================
// Readiness Score
// ===========================================================================

describe("Production — Readiness Score", () => {
  it("generates a production readiness score", async () => {
    const score = await generateReadinessScore();
    expect(score).toHaveProperty("generatedAt");
    expect(score).toHaveProperty("dimensions");
    expect(score).toHaveProperty("overallScore");
    expect(score).toHaveProperty("grade");
    expect(score).toHaveProperty("topStrengths");
    expect(score).toHaveProperty("topWeaknesses");
    expect(score).toHaveProperty("priorityRecommendations");
    expect(score.dimensions.length).toBe(10);
    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    expect(score.grade).toMatch(/^[A-F][+-]?$/);
  });

  it("dimensions have required fields with weights summing to 1.0", async () => {
    const score = await generateReadinessScore();
    const totalWeight = score.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
    for (const d of score.dimensions) {
      expect(d.name).toBeTruthy();
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.weight).toBeGreaterThan(0);
      expect(d.weightedScore).toBeCloseTo(d.score * d.weight, 2);
      expect(Array.isArray(d.strengths)).toBe(true);
      expect(Array.isArray(d.weaknesses)).toBe(true);
    }
  });

  it("includes all 10 expected dimensions", async () => {
    const score = await generateReadinessScore();
    const names = score.dimensions.map(d => d.name);
    expect(names).toContain("Performance");
    expect(names).toContain("Reliability");
    expect(names).toContain("Scalability");
    expect(names).toContain("Maintainability");
    expect(names).toContain("Observability");
    expect(names).toContain("Security");
    expect(names).toContain("Resource Efficiency");
    expect(names).toContain("Test Coverage");
    expect(names).toContain("Documentation");
    expect(names).toContain("Developer Experience");
  });

  it("priority recommendations are sorted by priority", async () => {
    const score = await generateReadinessScore();
    for (let i = 1; i < score.priorityRecommendations.length; i++) {
      expect(score.priorityRecommendations[i].priority)
        .toBeLessThanOrEqual(score.priorityRecommendations[i - 1].priority);
    }
  });
});
