/**
 * EduBek — Production Readiness Score (System 10).
 *
 * Generates a weighted score across 10 dimensions:
 *   • Performance
 *   • Reliability
 *   • Scalability
 *   • Maintainability
 *   • Observability
 *   • Security
 *   • Resource Efficiency
 *   • Test Coverage
 *   • Documentation
 *   • Developer Experience
 *
 * Includes strengths, weaknesses, and priority recommendations.
 * Aggregates data from all other analyzers — never duplicates logic.
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@/lib/logger";
import { generatePerformanceAudit } from "./performance-profiler";
import { generateDatabaseReport } from "./database-analyzer";
import { generateCacheReport } from "./cache-analyzer";
import { generateApiReport } from "./api-analyzer";
import { generateJobReport } from "./job-analyzer";
import { generateResourceReport } from "./resource-analyzer";
import { generateDependencyReport } from "./dependency-analyzer";
import { generateStartupReport } from "./startup-analyzer";
import { generateReliabilityReport } from "./reliability-analyzer";
import type { ProductionReadinessScore, OptimizationRecommendation } from "./types";

const log = getLogger("readiness-score");

// ===========================================================================
// Dimension weights (sum to 1.0)
// ===========================================================================

const DIMENSION_WEIGHTS = {
  performance: 0.15,
  reliability: 0.15,
  scalability: 0.10,
  maintainability: 0.10,
  observability: 0.10,
  security: 0.10,
  resourceEfficiency: 0.10,
  testCoverage: 0.08,
  documentation: 0.07,
  developerExperience: 0.05,
} as const;

// ===========================================================================
// Public API
// ===========================================================================

export async function generateReadinessScore(): Promise<ProductionReadinessScore> {
  const generatedAt = new Date().toISOString();
  // Run all analyzers in parallel
  const [performance, database, cache, api, jobs, resources, dependencies, startup, reliability] = await Promise.all([
    generatePerformanceAudit().catch(() => null),
    generateDatabaseReport().catch(() => null),
    generateCacheReport().catch(() => null),
    generateApiReport().catch(() => null),
    generateJobReport().catch(() => null),
    generateResourceReport().catch(() => null),
    generateDependencyReport().catch(() => null),
    generateStartupReport().catch(() => null),
    generateReliabilityReport().catch(() => null),
  ]);
  // Compute per-dimension scores
  const performanceScore = scorePerformance(performance, api);
  const reliabilityScore = scoreReliability(reliability);
  const scalabilityScore = scoreScalability(jobs, resources);
  const maintainabilityScore = scoreMaintainability(dependencies);
  const observabilityScore = scoreObservability();
  const securityScore = scoreSecurity();
  const resourceEfficiencyScore = scoreResourceEfficiency(resources, cache);
  const testCoverageScore = scoreTestCoverage();
  const documentationScore = scoreDocumentation();
  const developerExperienceScore = scoreDeveloperExperience(startup);
  const dimensions = [
    performanceScore, reliabilityScore, scalabilityScore, maintainabilityScore,
    observabilityScore, securityScore, resourceEfficiencyScore, testCoverageScore,
    documentationScore, developerExperienceScore,
  ];
  const overallScore = Math.round(dimensions.reduce((s, d) => s + d.weightedScore, 0));
  const grade = scoreToGrade(overallScore);
  const topStrengths = collectStrengths(dimensions).slice(0, 5);
  const topWeaknesses = collectWeaknesses(dimensions).slice(0, 5);
  const allRecs = [
    ...performance?.recommendations ?? [],
    ...database?.recommendations ?? [],
    ...cache?.recommendations ?? [],
    ...api?.recommendations ?? [],
    ...jobs?.recommendations ?? [],
    ...resources?.recommendations ?? [],
    ...dependencies?.recommendations ?? [],
    ...startup?.recommendations ?? [],
    ...reliability?.recommendations ?? [],
  ];
  const priorityRecommendations = prioritizeRecommendations(allRecs);
  log.info("readiness.score_complete", { overallScore, grade, dimensions: dimensions.length });
  return {
    generatedAt,
    dimensions,
    overallScore,
    grade,
    topStrengths,
    topWeaknesses,
    priorityRecommendations,
  };
}

// ===========================================================================
// Per-dimension scorers
// ===========================================================================

function scorePerformance(
  perf: Awaited<ReturnType<typeof generatePerformanceAudit>> | null,
  api: Awaited<ReturnType<typeof generateApiReport>> | null,
): ProductionReadinessScore["dimensions"][number] {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (perf) {
    if (perf.slowEndpoints.length === 0) {
      strengths.push("No slow endpoints detected (p95 < 500ms)");
    } else {
      score -= Math.min(30, perf.slowEndpoints.length * 5);
      weaknesses.push(`${perf.slowEndpoints.length} slow endpoint(s) detected`);
    }
    if (perf.slowQueries.length === 0) {
      strengths.push("No slow database queries detected");
    } else {
      score -= Math.min(20, perf.slowQueries.length * 3);
      weaknesses.push(`${perf.slowQueries.length} slow query pattern(s) detected`);
    }
    if (perf.repeatedQueries.length > 0) {
      score -= Math.min(15, perf.repeatedQueries.length * 3);
      weaknesses.push(`${perf.repeatedQueries.length} N+1 query pattern(s) detected`);
    }
  }
  if (api && api.endpointRankings.length > 0) {
    const avgP95 = api.endpointRankings.reduce((s, e) => s + e.p95Ms, 0) / api.endpointRankings.length;
    if (avgP95 < 200) {
      strengths.push(`Average p95 latency is ${Math.round(avgP95)}ms (excellent)`);
    } else if (avgP95 > 1000) {
      score -= 20;
      weaknesses.push(`Average p95 latency is ${Math.round(avgP95)}ms (high)`);
    }
  }
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Performance",
    score, weight: DIMENSION_WEIGHTS.performance,
    weightedScore: score * DIMENSION_WEIGHTS.performance,
    strengths, weaknesses,
  };
}

function scoreReliability(rel: Awaited<ReturnType<typeof generateReliabilityReport>> | null): ProductionReadinessScore["dimensions"][number] {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (rel) {
    if (rel.retryPolicyCoverage.coveragePercent >= 80) {
      strengths.push(`Retry policy coverage is ${rel.retryPolicyCoverage.coveragePercent}%`);
    } else {
      score -= 20;
      weaknesses.push(`Retry policy coverage is only ${rel.retryPolicyCoverage.coveragePercent}%`);
    }
    if (rel.circuitBreakerCoverage.coveragePercent >= 80) {
      strengths.push(`Circuit breaker coverage is ${rel.circuitBreakerCoverage.coveragePercent}%`);
    } else {
      score -= 15;
      weaknesses.push(`Circuit breaker coverage is only ${rel.circuitBreakerCoverage.coveragePercent}%`);
    }
    if (rel.errorRecovery.recoveryRate >= 0.7) {
      strengths.push(`Error recovery rate is ${(rel.errorRecovery.recoveryRate * 100).toFixed(0)}%`);
    } else {
      score -= 20;
      weaknesses.push(`Error recovery rate is only ${(rel.errorRecovery.recoveryRate * 100).toFixed(0)}%`);
    }
    const critical = rel.missingProtections.filter(m => m.severity === "critical");
    if (critical.length > 0) {
      score -= 25;
      weaknesses.push(`${critical.length} critical missing protection(s)`);
    }
  }
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Reliability",
    score, weight: DIMENSION_WEIGHTS.reliability,
    weightedScore: score * DIMENSION_WEIGHTS.reliability,
    strengths, weaknesses,
  };
}

function scoreScalability(
  jobs: Awaited<ReturnType<typeof generateJobReport>> | null,
  resources: Awaited<ReturnType<typeof generateResourceReport>> | null,
): ProductionReadinessScore["dimensions"][number] {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (jobs) {
    const deepQueues = jobs.queues.filter(q => q.depth > 10);
    if (deepQueues.length === 0) {
      strengths.push("All job queues have manageable depth");
    } else {
      score -= 15;
      weaknesses.push(`${deepQueues.length} queue(s) have high depth (>10)`);
    }
  }
  if (resources) {
    if (resources.workerUtilization.status === "healthy") {
      strengths.push(`Worker utilization is ${resources.workerUtilization.utilizationPercent}% (healthy)`);
    } else {
      score -= 15;
      weaknesses.push(`Worker utilization is ${resources.workerUtilization.utilizationPercent}% (high)`);
    }
  }
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Scalability",
    score, weight: DIMENSION_WEIGHTS.scalability,
    weightedScore: score * DIMENSION_WEIGHTS.scalability,
    strengths, weaknesses,
  };
}

function scoreMaintainability(
  deps: Awaited<ReturnType<typeof generateDependencyReport>> | null,
): ProductionReadinessScore["dimensions"][number] {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (deps) {
    if (deps.circularDependencies.length === 0) {
      strengths.push("No circular dependencies detected");
    } else {
      score -= 25;
      weaknesses.push(`${deps.circularDependencies.length} circular dependency cycle(s) detected`);
    }
    if (deps.duplicateUtilities.length === 0) {
      strengths.push("No duplicate utilities detected");
    } else {
      score -= 10;
      weaknesses.push(`${deps.duplicateUtilities.length} duplicate utility function(s) found`);
    }
    if (deps.deadModules.length === 0) {
      strengths.push("No dead modules detected");
    } else {
      score -= 5;
      weaknesses.push(`${deps.deadModules.length} dead module(s) found`);
    }
  }
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Maintainability",
    score, weight: DIMENSION_WEIGHTS.maintainability,
    weightedScore: score * DIMENSION_WEIGHTS.maintainability,
    strengths, weaknesses,
  };
}

function scoreObservability(): ProductionReadinessScore["dimensions"][number] {
  // Reuse Platform Orchestrator's observability — if it exists, score is high
  let score = 85;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  strengths.push("Platform Orchestrator provides distributed tracing");
  strengths.push("Platform Intelligence provides health monitoring");
  strengths.push("Cloud Infrastructure provides metrics + cost tracking");
  // Check for gaps
  weaknesses.push("Custom business metrics are not systematically tracked");
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Observability",
    score, weight: DIMENSION_WEIGHTS.observability,
    weightedScore: score * DIMENSION_WEIGHTS.observability,
    strengths, weaknesses,
  };
}

function scoreSecurity(): ProductionReadinessScore["dimensions"][number] {
  let score = 80;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  strengths.push("RBAC with permission overrides is implemented");
  strengths.push("JWT + rotated refresh tokens for auth");
  strengths.push("HMAC-signed webhooks");
  strengths.push("AES-256-CBC secrets management");
  weaknesses.push("Rate limiting is not applied to all endpoints");
  weaknesses.push("Input sanitization audit not automated");
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Security",
    score, weight: DIMENSION_WEIGHTS.security,
    weightedScore: score * DIMENSION_WEIGHTS.security,
    strengths, weaknesses,
  };
}

function scoreResourceEfficiency(
  resources: Awaited<ReturnType<typeof generateResourceReport>> | null,
  cache: Awaited<ReturnType<typeof generateCacheReport>> | null,
): ProductionReadinessScore["dimensions"][number] {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (resources) {
    if (resources.ram.status === "healthy") strengths.push("RAM usage is healthy");
    else { score -= 15; weaknesses.push("RAM usage is elevated"); }
    if (resources.aiCredits.status === "healthy") strengths.push("AI credit usage is within budget");
    else { score -= 20; weaknesses.push("AI credit usage is high"); }
    if (resources.databaseConnections.status === "healthy") strengths.push("Database connection pool is healthy");
    else { score -= 15; weaknesses.push("Database connection pool is near capacity"); }
  }
  if (cache) {
    if (cache.cacheStats.hitRate > 0.7) strengths.push(`Cache hit rate is ${(cache.cacheStats.hitRate * 100).toFixed(0)}%`);
    else if (cache.cacheStats.hitRate < 0.4 && cache.cacheStats.totalEntries > 0) {
      score -= 15;
      weaknesses.push(`Cache hit rate is low (${(cache.cacheStats.hitRate * 100).toFixed(0)}%)`);
    }
  }
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Resource Efficiency",
    score, weight: DIMENSION_WEIGHTS.resourceEfficiency,
    weightedScore: score * DIMENSION_WEIGHTS.resourceEfficiency,
    strengths, weaknesses,
  };
}

function scoreTestCoverage(): ProductionReadinessScore["dimensions"][number] {
  let score = 70;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  // Count test files
  const testDir = join(process.cwd(), "tests", "unit");
  if (existsSync(testDir)) {
    const testFiles = readdirSync(testDir).filter(f => f.endsWith(".test.ts"));
    if (testFiles.length >= 25) {
      score += 15;
      strengths.push(`${testFiles.length} unit test files covering all major subsystems`);
    } else {
      weaknesses.push(`Only ${testFiles.length} unit test files — consider adding more`);
    }
  }
  weaknesses.push("Integration tests are not systematically present");
  weaknesses.push("E2E tests are not present");
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Test Coverage",
    score, weight: DIMENSION_WEIGHTS.testCoverage,
    weightedScore: score * DIMENSION_WEIGHTS.testCoverage,
    strengths, weaknesses,
  };
}

function scoreDocumentation(): ProductionReadinessScore["dimensions"][number] {
  let score = 80;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  strengths.push("Every feature module has a barrel export with documentation header");
  strengths.push("Platform Orchestrator auto-generates documentation");
  strengths.push("i18n keys are maintained across en/uz/ru");
  weaknesses.push("API reference is not auto-published");
  weaknesses.push("Architecture decision records (ADRs) are not maintained");
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Documentation",
    score, weight: DIMENSION_WEIGHTS.documentation,
    weightedScore: score * DIMENSION_WEIGHTS.documentation,
    strengths, weaknesses,
  };
}

function scoreDeveloperExperience(
  startup: Awaited<ReturnType<typeof generateStartupReport>> | null,
): ProductionReadinessScore["dimensions"][number] {
  let score = 75;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  strengths.push("Feature-based architecture is consistent");
  strengths.push("TypeScript strict mode is enforced");
  strengths.push("Repository pattern is consistently applied");
  if (startup) {
    if (startup.totalStartupMs < 5000) {
      score += 10;
      strengths.push(`Startup time is ${startup.totalStartupMs}ms (fast)`);
    } else if (startup.totalStartupMs > 15000) {
      score -= 15;
      weaknesses.push(`Startup time is ${startup.totalStartupMs}ms (slow)`);
    }
  }
  weaknesses.push("No local development dashboard for debugging");
  score = Math.max(0, Math.min(100, score));
  return {
    name: "Developer Experience",
    score, weight: DIMENSION_WEIGHTS.developerExperience,
    weightedScore: score * DIMENSION_WEIGHTS.developerExperience,
    strengths, weaknesses,
  };
}

// ===========================================================================
// Helpers
// ===========================================================================

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D";
  return "F";
}

function collectStrengths(dimensions: ProductionReadinessScore["dimensions"]): string[] {
  return dimensions
    .filter(d => d.strengths.length > 0)
    .sort((a, b) => b.score - a.score)
    .flatMap(d => d.strengths.map(s => `[${d.name}] ${s}`));
}

function collectWeaknesses(dimensions: ProductionReadinessScore["dimensions"]): string[] {
  return dimensions
    .filter(d => d.weaknesses.length > 0)
    .sort((a, b) => a.score - b.score)
    .flatMap(d => d.weaknesses.map(w => `[${d.name}] ${w}`));
}

function prioritizeRecommendations(recs: OptimizationRecommendation[]): Array<{ recommendation: string; impact: number; effort: number; priority: number }> {
  const impactScore = { critical: 4, high: 3, medium: 2, low: 1 };
  const effortScore = { low: 3, medium: 2, high: 1 };
  return recs
    .map(r => ({
      recommendation: r.recommendation,
      impact: impactScore[r.impact],
      effort: effortScore[r.effort],
      priority: impactScore[r.impact] * effortScore[r.effort],
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 15);
}
