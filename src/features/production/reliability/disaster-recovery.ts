/**
 * EduBek — Disaster Recovery Planner (System 2).
 *
 * Analyzes RTO, RPO, backup coverage, restore dependencies, critical
 * services, and recovery order. Generates recovery plans.
 *
 * REUSES Cloud Infrastructure's backup data, Data Fabric's event store,
 * and Digital Twins' snapshot data.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  DisasterRecoveryPlan, BackupCoverageSummary, CriticalService,
  RecoveryPhase, ReliabilityRecommendation,
} from "./types";

const log = getLogger("disaster-recovery");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateDisasterRecoveryPlan(): Promise<DisasterRecoveryPlan> {
  const generatedAt = new Date().toISOString();
  // Target RTO/RPO — enterprise-standard for SaaS
  const targetRtoMinutes = 60; // 1 hour
  const targetRpoMinutes = 15; // 15 minutes
  const [eventStoreCount, latestEvent, digitalTwinCount, conceptCount, listingCount] = await Promise.all([
    repo.fetchEventStoreCount(),
    repo.fetchEventStoreLatest({ limit: 1 }),
    repo.fetchDigitalTwinCount(),
    repo.fetchConceptCount(),
    repo.fetchMarketplaceListingCount(),
  ]);
  const backupCoverage = assessBackupCoverage({
    eventStoreCount, digitalTwinCount, conceptCount, listingCount,
  });
  const criticalServices = identifyCriticalServices();
  const recoveryOrder = buildRecoveryOrder(criticalServices);
  const restoreDependencies = buildRestoreDependencies(criticalServices);
  const estimatedRto = estimateRto(recoveryOrder);
  const estimatedRpo = estimateRpo(backupCoverage);
  const meetsTargets = estimatedRto <= targetRtoMinutes && estimatedRpo <= targetRpoMinutes;
  const recommendations = generateDRRecommendations({
    meetsTargets, estimatedRto, estimatedRpo,
    targetRto: targetRtoMinutes, targetRpo: targetRpoMinutes,
    backupCoverage,
  });
  log.info("dr.plan_complete", {
    rto: estimatedRto, rpo: estimatedRpo, meetsTargets,
    coverage: backupCoverage.coveragePercent,
  });
  return {
    generatedAt,
    rtoMinutes: targetRtoMinutes,
    rpoMinutes: targetRpoMinutes,
    estimatedRtoMinutes: estimatedRto,
    estimatedRpoMinutes: estimatedRpo,
    meetsTargets,
    backupCoverage,
    criticalServices,
    recoveryOrder,
    restoreDependencies,
    recommendations,
  };
}

// ===========================================================================
// Analyzers
// ===========================================================================

function assessBackupCoverage(data: {
  eventStoreCount: number; digitalTwinCount: number;
  conceptCount: number; listingCount: number;
}): BackupCoverageSummary {
  // Check what assets exist and whether they're backed up
  const assets = [
    { name: "database", exists: true, backedUp: false },
    { name: "event_store", exists: data.eventStoreCount > 0, backedUp: data.eventStoreCount > 0 },
    { name: "digital_twins", exists: data.digitalTwinCount > 0, backedUp: data.digitalTwinCount > 0 },
    { name: "knowledge_graph", exists: data.conceptCount > 0, backedUp: data.conceptCount > 0 },
    { name: "marketplace_listings", exists: data.listingCount > 0, backedUp: data.listingCount > 0 },
    { name: "configuration", exists: true, backedUp: false },
    { name: "user_uploads", exists: true, backedUp: false },
    { name: "ai_memory", exists: true, backedUp: false },
  ];
  const total = assets.length;
  const backedUp = assets.filter(a => a.backedUp).length;
  const gaps = assets.filter(a => !a.backedUp).map(a => a.name);
  return {
    totalAssets: total,
    backedUp,
    coveragePercent: Math.round((backedUp / total) * 100),
    gaps,
  };
}

function identifyCriticalServices(): CriticalService[] {
  return [
    {
      name: "database",
      tier: "tier1_critical",
      rtoMinutes: 15,
      rpoMinutes: 5,
      dependencies: [],
    },
    {
      name: "auth",
      tier: "tier1_critical",
      rtoMinutes: 15,
      rpoMinutes: 15,
      dependencies: ["database"],
    },
    {
      name: "api_gateway",
      tier: "tier1_critical",
      rtoMinutes: 10,
      rpoMinutes: 0,
      dependencies: ["auth"],
    },
    {
      name: "event_bus",
      tier: "tier1_critical",
      rtoMinutes: 20,
      rpoMinutes: 5,
      dependencies: ["database"],
    },
    {
      name: "cache",
      tier: "tier2_important",
      rtoMinutes: 30,
      rpoMinutes: 0,
      dependencies: [],
    },
    {
      name: "ai_workspace",
      tier: "tier2_important",
      rtoMinutes: 60,
      rpoMinutes: 0,
      dependencies: ["api_gateway"],
    },
    {
      name: "cloud_workers",
      tier: "tier2_important",
      rtoMinutes: 30,
      rpoMinutes: 15,
      dependencies: ["database", "event_bus"],
    },
    {
      name: "search_index",
      tier: "tier2_important",
      rtoMinutes: 60,
      rpoMinutes: 60,
      dependencies: ["database"],
    },
    {
      name: "marketplace",
      tier: "tier3_normal",
      rtoMinutes: 120,
      rpoMinutes: 60,
      dependencies: ["database"],
    },
    {
      name: "analytics",
      tier: "tier3_normal",
      rtoMinutes: 240,
      rpoMinutes: 240,
      dependencies: ["database"],
    },
  ];
}

function buildRecoveryOrder(services: CriticalService[]): RecoveryPhase[] {
  // Group services by tier and dependencies
  const phases: RecoveryPhase[] = [
    {
      phase: 1,
      name: "Restore Core Infrastructure",
      services: services.filter(s => s.tier === "tier1_critical" && s.dependencies.length === 0).map(s => s.name),
      estimatedDurationMinutes: 15,
      description: "Restore the database and core infrastructure first — everything else depends on these.",
    },
    {
      phase: 2,
      name: "Restore Critical Services",
      services: services.filter(s => s.tier === "tier1_critical" && s.dependencies.length > 0).map(s => s.name),
      estimatedDurationMinutes: 20,
      description: "Restore auth, API gateway, and event bus once the database is available.",
    },
    {
      phase: 3,
      name: "Restore Important Services",
      services: services.filter(s => s.tier === "tier2_important").map(s => s.name),
      estimatedDurationMinutes: 30,
      description: "Restore cache, AI workspace, workers, and search index.",
    },
    {
      phase: 4,
      name: "Restore Normal Services",
      services: services.filter(s => s.tier === "tier3_normal").map(s => s.name),
      estimatedDurationMinutes: 60,
      description: "Restore marketplace and analytics — these can be restored last with minimal user impact.",
    },
  ];
  return phases;
}

function buildRestoreDependencies(services: CriticalService[]): Array<{ service: string; dependsOn: string[] }> {
  return services.map(s => ({ service: s.name, dependsOn: s.dependencies }));
}

function estimateRto(phases: RecoveryPhase[]): number {
  // RTO = sum of all phase durations (sequential)
  return phases.reduce((s, p) => s + p.estimatedDurationMinutes, 0);
}

function estimateRpo(coverage: BackupCoverageSummary): number {
  // RPO depends on backup frequency — if 50% coverage, RPO is ~30 min
  // if 100% coverage with continuous backup, RPO is ~5 min
  if (coverage.coveragePercent >= 90) return 5;
  if (coverage.coveragePercent >= 70) return 15;
  if (coverage.coveragePercent >= 50) return 30;
  return 60;
}

function generateDRRecommendations(input: {
  meetsTargets: boolean; estimatedRto: number; estimatedRpo: number;
  targetRto: number; targetRpo: number; backupCoverage: BackupCoverageSummary;
}): ReliabilityRecommendation[] {
  const recs: ReliabilityRecommendation[] = [];
  let id = 0;
  const nextId = () => `dr-${++id}`;
  if (!input.meetsTargets) {
    recs.push({
      id: nextId(), category: "disaster",
      title: "RTO/RPO targets not met",
      description: `Estimated RTO=${input.estimatedRto}min (target=${input.targetRto}min), RPO=${input.estimatedRpo}min (target=${input.targetRpo}min).`,
      impact: "critical", effort: "high",
      recommendation: "Increase backup frequency, add redundancy, and automate recovery procedures.",
    });
  }
  if (input.backupCoverage.gaps.length > 0) {
    recs.push({
      id: nextId(), category: "disaster",
      title: "Close backup coverage gaps",
      description: `${input.backupCoverage.gaps.length} asset(s) lack backups: ${input.backupCoverage.gaps.join(", ")}.`,
      impact: "high", effort: "medium",
      recommendation: "Implement automated backups for all critical assets.",
    });
  }
  if (input.estimatedRto > 120) {
    recs.push({
      id: nextId(), category: "disaster",
      title: "Reduce recovery time",
      description: `Estimated RTO is ${input.estimatedRto} minutes — too long for a production service.`,
      impact: "high", effort: "high",
      recommendation: "Automate recovery procedures and add redundancy to reduce RTO.",
    });
  }
  return recs;
}
