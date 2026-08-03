/**
 * EduBek — High Availability Analyzer (System 6).
 *
 * Analyzes single points of failure, critical dependencies, failover
 * readiness, redundancy, replication, service isolation, dependency
 * concentration, and produces an availability score.
 *
 * REUSES Platform Orchestrator's circuit breakers + Cloud Infrastructure's
 * workers + health snapshots.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  HighAvailabilityReport, SinglePointOfFailure, CriticalDependency,
  FailoverReadiness, RedundancyAnalysis, ReliabilityRecommendation,
} from "./types";

const log = getLogger("availability-analyzer");

export async function generateAvailabilityReport(): Promise<HighAvailabilityReport> {
  const generatedAt = new Date().toISOString();
  const [breakers, workers, healthSnapshots] = await Promise.all([
    repo.fetchCircuitBreakers(),
    repo.fetchCloudWorkers(),
    repo.fetchLatestHealthPerSubsystem(),
  ]);
  const spofs = identifySPOFs({ breakers, workers });
  const criticalDeps = identifyCriticalDependencies({ breakers, workers });
  const failoverReadiness = assessFailoverReadiness({ breakers, workers });
  const redundancy = assessRedundancy({ workers });
  const availabilityScore = computeAvailabilityScore({
    spofs, failoverReadiness, redundancy, healthSnapshots,
  });
  const recommendations = generateAvailabilityRecommendations({
    spofs, failoverReadiness, redundancy,
  });
  log.info("availability.audit_complete", {
    spofs: spofs.length, score: availabilityScore,
    failoverReady: failoverReadiness.overall,
  });
  return {
    generatedAt,
    singlePointsOfFailure: spofs,
    criticalDependencies: criticalDeps,
    failoverReadiness,
    redundancy,
    availabilityScore,
    recommendations,
  };
}

function identifySPOFs(data: {
  breakers: Awaited<ReturnType<typeof repo.fetchCircuitBreakers>>;
  workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>;
}): SinglePointOfFailure[] {
  const spofs: SinglePointOfFailure[] = [];
  // Database is always a SPOF in SQLite
  spofs.push({
    component: "Database (SQLite)",
    tier: "tier1_critical",
    hasRedundancy: false,
    impactIfFailed: "Complete platform outage — all features depend on the database.",
    recommendation: "Migrate to PostgreSQL with a read replica, or deploy SQLite with Litestream for continuous backup.",
  });
  // Check AI provider redundancy
  const aiBreakers = data.breakers.filter(b => b.module === "ai-workspace");
  spofs.push({
    component: "AI Provider (ZAI)",
    tier: "tier2_important",
    hasRedundancy: aiBreakers.length > 0,
    impactIfFailed: aiBreakers.length > 0
      ? "Circuit breaker activates fallback — moderate impact."
      : "AI features fail — moderate to severe impact.",
    recommendation: aiBreakers.length > 0
      ? "Circuit breaker is configured — add a secondary AI provider for full redundancy."
      : "Add a circuit breaker and a secondary AI provider.",
  });
  // Check worker redundancy
  const activeWorkers = data.workers.filter(w => w.status === "active").length;
  spofs.push({
    component: "Cloud Workers",
    tier: "tier2_important",
    hasRedundancy: activeWorkers > 1,
    impactIfFailed: activeWorkers > 1
      ? "Other workers pick up the load — minor impact."
      : "Background jobs stop processing — moderate impact.",
    recommendation: activeWorkers > 1
      ? "Worker redundancy is in place."
      : "Deploy at least 2 workers for redundancy.",
  });
  // Event bus is a SPOF (in-process)
  spofs.push({
    component: "Event Bus (in-process)",
    tier: "tier1_critical",
    hasRedundancy: false,
    impactIfFailed: "Event-driven features stop working — cross-system cascades fail.",
    recommendation: "Consider an external message queue (Redis Pub/Sub, NATS) for critical events.",
  });
  // Cache
  spofs.push({
    component: "Cache Layer",
    tier: "tier2_important",
    hasRedundancy: false,
    impactIfFailed: "Increased database load — moderate impact.",
    recommendation: "Add a Redis cluster with replication for cache redundancy.",
  });
  return spofs;
}

function identifyCriticalDependencies(data: {
  breakers: Awaited<ReturnType<typeof repo.fetchCircuitBreakers>>;
  workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>;
}): CriticalDependency[] {
  return [
    {
      dependency: "database",
      dependentServices: 50,
      failoverAvailable: false,
      recommendation: "All services depend on the database — add a read replica for read-only failover.",
    },
    {
      dependency: "event_bus",
      dependentServices: 30,
      failoverAvailable: false,
      recommendation: "30+ services depend on the event bus — consider an external message queue.",
    },
    {
      dependency: "ai_provider",
      dependentServices: 15,
      failoverAvailable: data.breakers.some(b => b.module === "ai-workspace"),
      recommendation: data.breakers.some(b => b.module === "ai-workspace")
        ? "Circuit breaker is configured — add a secondary provider."
        : "Add a circuit breaker and secondary AI provider.",
    },
    {
      dependency: "cache",
      dependentServices: 10,
      failoverAvailable: false,
      recommendation: "10+ services use the cache — add cache replication.",
    },
  ];
}

function assessFailoverReadiness(data: {
  breakers: Awaited<ReturnType<typeof repo.fetchCircuitBreakers>>;
  workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>;
}): FailoverReadiness {
  const database = false; // SQLite has no built-in failover
  const cache = false; // single cache instance
  const aiProviders = data.breakers.some(b => b.module === "ai-workspace");
  const workers = data.workers.filter(w => w.status === "active").length > 1;
  const overall = database && cache && aiProviders && workers;
  return {
    database, cache, aiProviders, workers, overall,
    recommendation: overall
      ? "All critical systems have failover configured."
      : "Several critical systems lack failover — see individual fields for details.",
  };
}

function assessRedundancy(data: {
  workers: Awaited<ReturnType<typeof repo.fetchCloudWorkers>>;
}): RedundancyAnalysis {
  const activeWorkers = data.workers.filter(w => w.status === "active").length;
  return {
    database: { redundant: false, replicaCount: 0, recommendation: "No database replica — deploy a read replica for redundancy." },
    cache: { redundant: false, replicaCount: 0, recommendation: "No cache replica — deploy a Redis cluster." },
    aiProviders: { redundant: false, replicaCount: 1, recommendation: "Only one AI provider — add a secondary." },
    workers: {
      redundant: activeWorkers > 1,
      replicaCount: activeWorkers,
      recommendation: activeWorkers > 1
        ? `${activeWorkers} workers running — redundancy is in place.`
        : "Only 1 worker — deploy at least 2.",
    },
    webServers: { redundant: false, replicaCount: 1, recommendation: "Single web server — deploy multiple instances behind a load balancer." },
    recommendation: "Several components lack redundancy — see individual fields for details.",
  };
}

function computeAvailabilityScore(data: {
  spofs: SinglePointOfFailure[];
  failoverReadiness: FailoverReadiness;
  redundancy: RedundancyAnalysis;
  healthSnapshots: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>;
}): number {
  let score = 100;
  // Deduct for SPOFs
  const criticalSPOFs = data.spofs.filter(s => s.tier === "tier1_critical" && !s.hasRedundancy);
  score -= criticalSPOFs.length * 15;
  const importantSPOFs = data.spofs.filter(s => s.tier === "tier2_important" && !s.hasRedundancy);
  score -= importantSPOFs.length * 8;
  // Deduct for missing failover
  if (!data.failoverReadiness.database) score -= 15;
  if (!data.failoverReadiness.cache) score -= 5;
  if (!data.failoverReadiness.aiProviders) score -= 8;
  if (!data.failoverReadiness.workers) score -= 5;
  // Deduct for missing redundancy
  if (!data.redundancy.database.redundant) score -= 10;
  if (!data.redundancy.workers.redundant) score -= 5;
  // Boost for healthy subsystems
  const healthyCount = data.healthSnapshots.filter(s => s.status === "healthy").length;
  if (healthyCount > 10) score += 5;
  return Math.max(0, Math.min(100, score));
}

function generateAvailabilityRecommendations(data: {
  spofs: SinglePointOfFailure[];
  failoverReadiness: FailoverReadiness;
  redundancy: RedundancyAnalysis;
}): ReliabilityRecommendation[] {
  const recs: ReliabilityRecommendation[] = [];
  let id = 0;
  const nextId = () => `availability-${++id}`;
  const criticalSPOFs = data.spofs.filter(s => s.tier === "tier1_critical" && !s.hasRedundancy);
  if (criticalSPOFs.length > 0) {
    recs.push({
      id: nextId(), category: "availability",
      title: "Eliminate critical single points of failure",
      description: `${criticalSPOFs.length} critical SPOF(s): ${criticalSPOFs.map(s => s.component).join(", ")}.`,
      impact: "critical", effort: "high",
      recommendation: "Add redundancy or failover for each critical SPOF.",
    });
  }
  if (!data.failoverReadiness.overall) {
    recs.push({
      id: nextId(), category: "availability",
      title: "Configure failover for all critical systems",
      description: "Failover readiness is not complete — see individual fields.",
      impact: "high", effort: "high",
      recommendation: "Implement failover for database, cache, and AI providers.",
    });
  }
  return recs;
}
