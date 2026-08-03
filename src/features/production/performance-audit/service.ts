/**
 * EduBek — Production performance-audit service.
 *
 * Phase 6A.1: Composes every analyzer into a unified API surface.
 * Routes are thin wrappers around the functions exported here.
 */
import { generatePerformanceAudit, recordEndpointTiming, recordQueryTiming, recordEventLoopLag } from "./performance-profiler";
import { generateDatabaseReport } from "./database-analyzer";
import { generateCacheReport } from "./cache-analyzer";
import { generateApiReport } from "./api-analyzer";
import { generateJobReport } from "./job-analyzer";
import { generateResourceReport } from "./resource-analyzer";
import { generateDependencyReport } from "./dependency-analyzer";
import { generateStartupReport, recordStartupPhase } from "./startup-analyzer";
import { generateReliabilityReport } from "./reliability-analyzer";
import { generateReadinessScore } from "./readiness-score";
import * as repo from "./repository";

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
  repo,
};

export async function generateFullAudit() {
  const generatedAt = new Date().toISOString();
  const [performance, database, cache, api, jobs, resources, dependencies, startup, reliability, readiness] = await Promise.all([
    generatePerformanceAudit().catch(() => null),
    generateDatabaseReport().catch(() => null),
    generateCacheReport().catch(() => null),
    generateApiReport().catch(() => null),
    generateJobReport().catch(() => null),
    generateResourceReport().catch(() => null),
    generateDependencyReport().catch(() => null),
    generateStartupReport().catch(() => null),
    generateReliabilityReport().catch(() => null),
    generateReadinessScore().catch(() => null),
  ]);
  return {
    generatedAt,
    performance, database, cache, api, jobs, resources, dependencies, startup, reliability, readiness,
  };
}
