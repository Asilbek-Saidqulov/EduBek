/** Systems 1-7 — Telemetry, Balance, Economy, Difficulty, Educational, Meta, Segmentation. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeTelemetryEvent, getTelemetryEvents, storeTelemetrySummary, getTelemetrySummary,
  storeBalanceFinding, getBalanceFindings, storeBalanceReport,
  storeEconomyMetric, getEconomyMetric, storeEconomyReport, getEconomyReport,
  storeDifficultyFinding, getDifficultyFindings,
  storeEducationalKPI, getEducationalKPI, getAllEducationalKPIs,
  storeMetaTrend, getMetaTrends,
  storePlayerSegmentation, getPlayerSegmentation,
} from "./repository";
import type {
  TelemetryEvent, TelemetrySummary, GameModeId, BalanceFinding, BalanceReport,
  EconomyMetric, EconomyReport, DifficultyFinding, DifficultyIssue,
  EducationalKPI, MetaTrend, PlayerSegmentation, PlayerSegment,
} from "./types";

const log = getLogger("game-intelligence.telemetry");

// ===== System 1 — Gameplay Telemetry =====
export function recordTelemetry(input: {
  matchId: string; userId?: string | null; gameMode: string; eventType: string;
  durationMs?: number | null; value?: number | null; metadata?: Record<string, unknown>;
}): TelemetryEvent {
  const event: TelemetryEvent = {
    id: randomUUID(), matchId: input.matchId, userId: input.userId ?? null,
    gameMode: input.gameMode, eventType: input.eventType,
    timestamp: new Date().toISOString(), durationMs: input.durationMs ?? null,
    value: input.value ?? null, metadata: input.metadata ?? {},
  };
  storeTelemetryEvent(event);
  return event;
}

export function getMatchTelemetry(matchId: string): TelemetryEvent[] { return getTelemetryEvents(matchId); }

export function computeTelemetrySummary(matchId: string): TelemetrySummary | null {
  const events = getTelemetryEvents(matchId);
  if (events.length === 0) return null;
  const existing = getTelemetrySummary(matchId);
  const questionDurations = events.filter(e => e.eventType === "question_duration").map(e => e.durationMs ?? 0);
  const answerDist: Record<string, number> = {};
  for (const e of events.filter(e => e.eventType === "answer_submitted")) {
    const key = String(e.value ?? "unknown"); answerDist[key] = (answerDist[key] ?? 0) + 1;
  }
  const latencyEvents = events.filter(e => e.eventType === "latency").map(e => e.value ?? 0);
  const avgLatency = latencyEvents.length > 0 ? Math.round(latencyEvents.reduce((s, v) => s + v, 0) / latencyEvents.length) : 0;
  const summary: TelemetrySummary = {
    matchId, totalEvents: events.length, questionDurations, answerDistributions: answerDist,
    avgLatencyMs: avgLatency,
    reconnects: events.filter(e => e.eventType === "reconnect").length,
    disconnects: events.filter(e => e.eventType === "disconnect").length,
    timerExtensions: events.filter(e => e.eventType === "timer_extension").length,
    pauses: events.filter(e => e.eventType === "pause").length,
    skips: events.filter(e => e.eventType === "skip").length,
    overtime: events.filter(e => e.eventType === "overtime").length,
    hostInterventions: events.filter(e => e.eventType === "host_intervention").length,
  };
  storeTelemetrySummary(summary);
  return summary;
}

export function getTelemetrySummaryForMatch(matchId: string): TelemetrySummary | null { return getTelemetrySummary(matchId); }

// ===== System 2 — Balance Intelligence =====
export function recordBalanceFinding(input: {
  gameMode: GameModeId; category: string; severity: "info" | "warning" | "critical";
  metric: string; value: number; threshold: number; description: string;
}): BalanceFinding {
  const finding: BalanceFinding = {
    id: randomUUID(), gameMode: input.gameMode, category: input.category,
    severity: input.severity, metric: input.metric, value: input.value,
    threshold: input.threshold, description: input.description,
    timestamp: new Date().toISOString(),
  };
  storeBalanceFinding(finding);
  log.info("balance.finding", { gameMode: input.gameMode, metric: input.metric, severity: input.severity });
  return finding;
}

export function getBalanceFindingsForMode(gameMode: GameModeId): BalanceFinding[] { return getBalanceFindings(gameMode); }

export function generateBalanceReport(gameMode: GameModeId): BalanceReport {
  const findings = getBalanceFindings(gameMode);
  const report: BalanceReport = {
    gameMode, findings,
    avgScore: findings.find(f => f.metric === "avg_score")?.value ?? 0,
    accuracyRate: findings.find(f => f.metric === "accuracy")?.value ?? 0,
    completionRate: findings.find(f => f.metric === "completion_rate")?.value ?? 0,
    dropoffRate: findings.find(f => f.metric === "dropoff_rate")?.value ?? 0,
    updatedAt: new Date().toISOString(),
  };
  storeBalanceReport(report);
  return report;
}

// ===== System 3 — Economy Intelligence =====
export function recordEconomyMetric(input: {
  resource: string; mode: string; generated: number; consumed: number; inflationRate?: number;
}): EconomyMetric {
  const metric: EconomyMetric = {
    id: randomUUID(), resource: input.resource, mode: input.mode,
    generated: input.generated, consumed: input.consumed,
    netFlow: input.generated - input.consumed,
    inflationRate: input.inflationRate ?? 0, timestamp: new Date().toISOString(),
  };
  storeEconomyMetric(metric);
  return metric;
}

export function getEconomyMetricFor(resource: string): EconomyMetric | null { return getEconomyMetric(resource); }

export function generateEconomyReport(): EconomyReport {
  const xp = getEconomyMetric("xp"); const gold = getEconomyMetric("gold"); const res = getEconomyMetric("resources");
  const inflationDetected = (xp?.inflationRate ?? 0) > 0.1 || (gold?.inflationRate ?? 0) > 0.1;
  const report: EconomyReport = {
    xpEconomy: xp, goldEconomy: gold, resourceEconomy: res,
    cosmeticUnlockRate: 0, inflationDetected, updatedAt: new Date().toISOString(),
  };
  storeEconomyReport(report);
  return report;
}

export function getLatestEconomyReport(): EconomyReport | null { return getEconomyReport(); }

// ===== System 4 — Difficulty Intelligence =====
export function recordDifficultyFinding(input: {
  questionId?: string | null; issue: DifficultyIssue;
  avgAnswerTimeMs: number; correctRate: number; dropoutRate: number; description: string;
}): DifficultyFinding {
  const finding: DifficultyFinding = {
    id: randomUUID(), questionId: input.questionId ?? null, issue: input.issue,
    avgAnswerTimeMs: input.avgAnswerTimeMs, correctRate: input.correctRate,
    dropoutRate: input.dropoutRate, description: input.description,
    timestamp: new Date().toISOString(),
  };
  storeDifficultyFinding(finding);
  return finding;
}

export function getAllDifficultyFindings(): DifficultyFinding[] { return getDifficultyFindings(); }
export function getDifficultyByIssue(issue: DifficultyIssue): DifficultyFinding[] { return getDifficultyFindings().filter(f => f.issue === issue); }

// ===== System 5 — Educational Intelligence =====
export function recordEducationalKPI(input: {
  userId: string; knowledgeRetention: number; accuracyImprovement: number;
  learningProgression: number; masteryGrowth: number; engagement: number;
  participation: number; completion: number;
}): EducationalKPI {
  const kpi: EducationalKPI = { ...input };
  storeEducationalKPI(kpi);
  return kpi;
}

export function getEducationalKPIForUser(userId: string): EducationalKPI | null { return getEducationalKPI(userId); }
export function listAllEducationalKPIs(): EducationalKPI[] { return getAllEducationalKPIs(); }

// ===== System 6 — Meta Analytics =====
export function recordMetaTrend(input: {
  category: string; trend: string; value: number; previousValue: number;
}): MetaTrend {
  const changePct = input.previousValue !== 0 ? Math.round(((input.value - input.previousValue) / input.previousValue) * 100 * 100) / 100 : 0;
  const t: MetaTrend = {
    id: randomUUID(), category: input.category, trend: input.trend,
    value: input.value, previousValue: input.previousValue, changePct,
    timestamp: new Date().toISOString(),
  };
  storeMetaTrend(t);
  return t;
}

export function getMetaTrendsForCategory(category: string): MetaTrend[] { return getMetaTrends(category); }

// ===== System 7 — Player Segmentation =====
export function segmentPlayer(input: {
  userId: string; matchesPlayed: number; avgAccuracy: number; avgSpeedMs: number; winRate: number;
}): PlayerSegmentation {
  const segments: PlayerSegment[] = [];
  if (input.matchesPlayed < 10) segments.push("beginner");
  else if (input.matchesPlayed < 50) segments.push("casual");
  else segments.push("competitive");
  if (input.matchesPlayed > 100 && input.winRate > 0.6) segments.push("expert");
  if (input.avgSpeedMs > 0 && input.avgSpeedMs < 2000) segments.push("speed_player");
  if (input.avgAccuracy > 0.85) segments.push("accurate_player");
  if (input.winRate < 0.3 && input.matchesPlayed > 20) segments.push("risk_taker");
  if (input.matchesPlayed > 50 && input.avgAccuracy > 0.7) segments.push("builder");
  if (input.winRate > 0.5 && input.matchesPlayed > 30) segments.push("survivor");
  const seg: PlayerSegmentation = {
    userId: input.userId, segments, assignedAt: new Date().toISOString(),
    metrics: { matchesPlayed: input.matchesPlayed, avgAccuracy: input.avgAccuracy, avgSpeedMs: input.avgSpeedMs, winRate: input.winRate },
  };
  storePlayerSegmentation(seg);
  return seg;
}

export function getSegmentationForUser(userId: string): PlayerSegmentation | null { return getPlayerSegmentation(userId); }
export function supportsAllSegments(): PlayerSegment[] { return ["beginner", "casual", "competitive", "expert", "speed_player", "accurate_player", "risk_taker", "builder", "survivor"]; }
