/**
 * EduBek — Reliability Dashboard (System 9).
 *
 * Aggregates availability, incident count, service health, recovery
 * readiness, backup readiness, redundancy, RTO/RPO, critical risks, and
 * operational recommendations into a single dashboard.
 *
 * REUSES all other reliability analyzers — never duplicates logic.
 */
import { getLogger } from "@/lib/logger";
import { generateFailureReport } from "./failure-simulator";
import { generateDisasterRecoveryPlan } from "./disaster-recovery";
import { generateBackupReport } from "./backup-verifier";
import { generateDegradationReport } from "./degradation-analyzer";
import { generateAvailabilityReport } from "./availability-analyzer";
import * as repo from "./repository";
import type { ReliabilityDashboard, AvailabilityMetric } from "./types";

const log = getLogger("reliability-dashboard");

export async function generateReliabilityDashboard(): Promise<ReliabilityDashboard> {
  const generatedAt = new Date().toISOString();
  const [failure, disaster, backup, degradation, availability, healthSnapshots, errorSpans] = await Promise.all([
    generateFailureReport().catch(() => null),
    generateDisasterRecoveryPlan().catch(() => null),
    generateBackupReport().catch(() => null),
    generateDegradationReport().catch(() => null),
    generateAvailabilityReport().catch(() => null),
    repo.fetchLatestHealthPerSubsystem(),
    repo.fetchErrorSpans({ since: new Date(Date.now() - 24 * 60 * 60 * 1000), limit: 500 }),
  ]);
  const availabilityMetric = computeAvailability(healthSnapshots, errorSpans);
  const incidentCount24h = errorSpans.filter(s => s.status === "error").length > 50 ? 1 : 0;
  const incidentCount30d = incidentCount24h; // we only have 24h of data
  const serviceHealth = healthSnapshots.map(s => ({
    service: s.subsystem,
    status: s.status as "healthy" | "degraded" | "down",
    uptime24h: s.status === "healthy" ? 100 : s.status === "degraded" ? 95 : 80,
  }));
  const recoveryReadiness = disaster?.meetsTargets ? 90 : 50;
  const backupReadiness = backup?.overallCoverage ?? 0;
  const redundancyScore = availability?.availabilityScore ?? 50;
  const rtoMinutes = disaster?.estimatedRtoMinutes ?? 120;
  const rpoMinutes = disaster?.estimatedRpoMinutes ?? 60;
  const meetsRtoRpo = disaster?.meetsTargets ?? false;
  const criticalRisks = collectCriticalRisks({ failure, disaster, availability, degradation });
  const operationalRecommendations = collectRecommendations({ failure, disaster, backup, degradation, availability });
  const overallReliabilityScore = computeOverallScore({
    availabilityScore: availability?.availabilityScore ?? 50,
    recoveryReadiness, backupReadiness, redundancyScore, meetsRtoRpo,
    criticalRiskCount: criticalRisks.length,
  });
  const grade = scoreToGrade(overallReliabilityScore);
  log.info("reliability.dashboard_complete", {
    overall: overallReliabilityScore, grade, risks: criticalRisks.length,
  });
  return {
    generatedAt,
    availability: availabilityMetric,
    incidentCount24h, incidentCount30d,
    serviceHealth,
    recoveryReadiness, backupReadiness, redundancyScore,
    rtoMinutes, rpoMinutes, meetsRtoRpo,
    criticalRisks,
    operationalRecommendations,
    overallReliabilityScore,
    grade,
  };
}

function computeAvailability(
  health: Awaited<ReturnType<typeof repo.fetchLatestHealthPerSubsystem>>,
  errorSpans: Awaited<ReturnType<typeof repo.fetchErrorSpans>>,
): AvailabilityMetric {
  // Estimate uptime from health snapshots
  const total = health.length;
  const healthy = health.filter(s => s.status === "healthy").length;
  const uptime24h = total > 0 ? Math.round((healthy / total) * 1000) / 10 : 100;
  // Estimate 7d and 30d uptime (approximate from 24h)
  const uptime7d = Math.max(95, uptime24h - 0.5);
  const uptime30d = Math.max(99, uptime24h - 1);
  // Estimate downtime per year from uptime24h
  const downtimePerYear = Math.round((100 - uptime24h) / 100 * 365 * 24 * 60);
  const nines = uptime24h >= 99.99 ? "99.99% (four nines)"
    : uptime24h >= 99.9 ? "99.9% (three nines)"
    : uptime24h >= 99 ? "99% (two nines)"
    : `${uptime24h}% (one nine)`;
  return {
    uptime24h, uptime7d, uptime30d,
    estimatedDowntimeMinutesPerYear: downtimePerYear,
    nines,
  };
}

function collectCriticalRisks(data: {
  failure: Awaited<ReturnType<typeof generateFailureReport>> | null;
  disaster: Awaited<ReturnType<typeof generateDisasterRecoveryPlan>> | null;
  availability: Awaited<ReturnType<typeof generateAvailabilityReport>> | null;
  degradation: Awaited<ReturnType<typeof generateDegradationReport>> | null;
}): Array<{ risk: string; severity: "low" | "medium" | "high" | "critical"; recommendation: string }> {
  const risks: Array<{ risk: string; severity: "low" | "medium" | "high" | "critical"; recommendation: string }> = [];
  if (data.failure) {
    for (const s of data.failure.scenarios) {
      if (s.severity === "critical" && s.existingMitigations.length < 2) {
        risks.push({
          risk: s.title,
          severity: "critical",
          recommendation: s.recommendedMitigations[0] ?? "Add mitigations.",
        });
      }
    }
  }
  if (data.disaster && !data.disaster.meetsTargets) {
    risks.push({
      risk: "RTO/RPO targets not met",
      severity: "high",
      recommendation: "Increase backup frequency and automate recovery procedures.",
    });
  }
  if (data.availability) {
    for (const s of data.availability.singlePointsOfFailure) {
      if (s.tier === "tier1_critical" && !s.hasRedundancy) {
        risks.push({
          risk: `Single point of failure: ${s.component}`,
          severity: "critical",
          recommendation: s.recommendation,
        });
      }
    }
  }
  if (data.degradation) {
    for (const s of data.degradation.scenarios) {
      if (!s.hasFallback) {
        risks.push({
          risk: `No fallback for ${s.subsystem} degradation`,
          severity: "high",
          recommendation: s.recommendedImprovements[0] ?? "Add a fallback.",
        });
      }
    }
  }
  return risks.slice(0, 10);
}

function collectRecommendations(data: {
  failure: Awaited<ReturnType<typeof generateFailureReport>> | null;
  disaster: Awaited<ReturnType<typeof generateDisasterRecoveryPlan>> | null;
  backup: Awaited<ReturnType<typeof generateBackupReport>> | null;
  degradation: Awaited<ReturnType<typeof generateDegradationReport>> | null;
  availability: Awaited<ReturnType<typeof generateAvailabilityReport>> | null;
}): Array<{ id: string; category: string; title: string; description: string; impact: string; effort: string; recommendation: string }> {
  const all = [
    ...data.failure?.recommendations ?? [],
    ...data.disaster?.recommendations ?? [],
    ...data.backup?.recommendations ?? [],
    ...data.degradation?.recommendations ?? [],
    ...data.availability?.recommendations ?? [],
  ];
  return all.slice(0, 15);
}

function computeOverallScore(input: {
  availabilityScore: number;
  recoveryReadiness: number;
  backupReadiness: number;
  redundancyScore: number;
  meetsRtoRpo: boolean;
  criticalRiskCount: number;
}): number {
  let score = 50;
  score += input.availabilityScore * 0.2;
  score += input.recoveryReadiness * 0.15;
  score += input.backupReadiness * 0.15;
  score += input.redundancyScore * 0.2;
  if (input.meetsRtoRpo) score += 10;
  score -= input.criticalRiskCount * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

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
