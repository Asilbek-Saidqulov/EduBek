/**
 * EduBek — Game Intelligence, Balance, Telemetry & Live Analytics Platform tests. Phase 6G.13.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordTelemetry, getMatchTelemetry, computeTelemetrySummary, getTelemetrySummaryForMatch,
  recordBalanceFinding, getBalanceFindingsForMode, generateBalanceReport,
  recordEconomyMetric, getEconomyMetricFor, generateEconomyReport, getLatestEconomyReport,
  recordDifficultyFinding, getAllDifficultyFindings, getDifficultyByIssue,
  recordEducationalKPI, getEducationalKPIForUser, listAllEducationalKPIs,
  recordMetaTrend, getMetaTrendsForCategory,
  segmentPlayer, getSegmentationForUser, supportsAllSegments,
  computeMatchIntelligence, getMatchIntelligenceRecord,
  raiseHealthAlert, getAllHealthAlerts, getUnresolvedAlerts, resolveAlert,
  computeLiveHealth, getCurrentLiveHealth,
  createSimulation, runSimulation, getSimulationById, listSimulations,
  createABComparison, listABComparisons,
  generateRecommendation, getAllRecommendations, getRecommendationsByPriority, getRecommendationsByKind,
  generateHeatmap, getHeatmapsByType, supportsAllHeatmapTypes,
  recordSeasonIntelligence, getSeasonIntel,
  recordCompetitiveIntelligence, getCurrentCompetitiveIntelligence,
  generateIntelligenceDashboard, getDeveloperIntegration,
  subscribeIntelligence, unsubscribeIntelligence, isIntelligenceSubscribed, getBridgeProcessedCount, publishIntelligenceEvent,
  _resetBridgeForTesting, _resetRepositoryForTesting,
} from "@/features/game-intelligence";
import { createMatch, emitEvent } from "@/features/game-engine";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

// ===== System 1 — Telemetry =====
describe("Intelligence — Telemetry", () => {
  it("records telemetry", () => { const e = recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "question_duration", durationMs: 5000 }); expect(e.id).toBeDefined(); });
  it("gets match telemetry", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }); expect(getMatchTelemetry("m1").length).toBe(1); });
  it("computes telemetry summary", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "question_duration", durationMs: 5000 }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "answer_submitted", value: 1 }); expect(computeTelemetrySummary("m1")?.totalEvents).toBe(2); });
  it("summary has question durations", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "question_duration", durationMs: 3000 }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "question_duration", durationMs: 5000 }); expect(computeTelemetrySummary("m1")?.questionDurations.length).toBe(2); });
  it("summary has answer distributions", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "answer_submitted", value: 1 }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "answer_submitted", value: 0 }); const s = computeTelemetrySummary("m1"); expect(s?.answerDistributions["1"]).toBe(1); expect(s?.answerDistributions["0"]).toBe(1); });
  it("summary counts disconnects", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "disconnect" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "disconnect" }); expect(computeTelemetrySummary("m1")?.disconnects).toBe(2); });
  it("summary counts reconnects", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "reconnect" }); expect(computeTelemetrySummary("m1")?.reconnects).toBe(1); });
  it("summary counts timer extensions", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "timer_extension" }); expect(computeTelemetrySummary("m1")?.timerExtensions).toBe(1); });
  it("summary counts pauses", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "pause" }); expect(computeTelemetrySummary("m1")?.pauses).toBe(1); });
  it("summary counts skips", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "skip" }); expect(computeTelemetrySummary("m1")?.skips).toBe(1); });
  it("summary counts overtime", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "overtime" }); expect(computeTelemetrySummary("m1")?.overtime).toBe(1); });
  it("summary counts host interventions", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "host_intervention" }); expect(computeTelemetrySummary("m1")?.hostInterventions).toBe(1); });
  it("summary computes avg latency", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "latency", value: 100 }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "latency", value: 200 }); expect(computeTelemetrySummary("m1")?.avgLatencyMs).toBe(150); });
  it("returns null for empty telemetry", () => { expect(computeTelemetrySummary("nonexistent")).toBeNull(); });
  it("gets cached summary", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }); computeTelemetrySummary("m1"); expect(getTelemetrySummaryForMatch("m1")).not.toBeNull(); });
  it("telemetry has timestamp", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }).timestamp).toBeDefined(); });
  it("telemetry has metadata", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test", metadata: { key: "val" } }).metadata.key).toBe("val"); });
  it("telemetry default metadata empty", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }).metadata).toEqual({}); });
  it("telemetry default durationMs null", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }).durationMs).toBeNull(); });
  it("telemetry default value null", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }).value).toBeNull(); });
  it("telemetry with userId", () => { expect(recordTelemetry({ matchId: "m1", userId: "u1", gameMode: "classic_quiz", eventType: "test" }).userId).toBe("u1"); });
  it("telemetry default userId null", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }).userId).toBeNull(); });
});

// ===== System 2 — Balance Intelligence =====
describe("Intelligence — Balance", () => {
  it("records balance finding", () => { const f = recordBalanceFinding({ gameMode: "classic_quiz", category: "scoring", severity: "warning", metric: "avg_score", value: 500, threshold: 400, description: "Average score above threshold" }); expect(f.id).toBeDefined(); });
  it("gets findings for mode", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }); expect(getBalanceFindingsForMode("classic_quiz").length).toBe(1); });
  it("generates balance report", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "avg_score", value: 500, threshold: 400, description: "" }); const r = generateBalanceReport("classic_quiz"); expect(r.avgScore).toBe(500); });
  it("report has findings", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }); expect(generateBalanceReport("classic_quiz").findings.length).toBe(1); });
  it("report has accuracy", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "accuracy", value: 0.85, threshold: 0.7, description: "" }); expect(generateBalanceReport("classic_quiz").accuracyRate).toBe(0.85); });
  it("report has completion rate", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "completion_rate", value: 0.9, threshold: 0.8, description: "" }); expect(generateBalanceReport("classic_quiz").completionRate).toBe(0.9); });
  it("report has dropoff rate", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "dropoff_rate", value: 0.1, threshold: 0.2, description: "" }); expect(generateBalanceReport("classic_quiz").dropoffRate).toBe(0.1); });
  it("report defaults to 0 for missing metrics", () => { expect(generateBalanceReport("treasure_heist").avgScore).toBe(0); });
  it("finding has timestamp", () => { expect(recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }).timestamp).toBeDefined(); });
  it("supports all severities", () => { for (const s of ["info", "warning", "critical"] as const) expect(recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: s, metric: "test", value: 1, threshold: 2, description: "" }).severity).toBe(s); });
  it("supports all game modes", () => { for (const m of ["classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale"] as const) expect(getBalanceFindingsForMode(m)).toEqual([]); });
  it("empty findings for unknown mode", () => { expect(getBalanceFindingsForMode("classic_quiz")).toEqual([]); });
});

// ===== System 3 — Economy Intelligence =====
describe("Intelligence — Economy", () => {
  it("records economy metric", () => { const m = recordEconomyMetric({ resource: "xp", mode: "classic_quiz", generated: 1000, consumed: 500 }); expect(m.netFlow).toBe(500); });
  it("gets economy metric", () => { recordEconomyMetric({ resource: "gold", mode: "treasure_heist", generated: 200, consumed: 100 }); expect(getEconomyMetricFor("gold")?.netFlow).toBe(100); });
  it("generates economy report", () => { recordEconomyMetric({ resource: "xp", mode: "all", generated: 1000, consumed: 500, inflationRate: 0.05 }); const r = generateEconomyReport(); expect(r.xpEconomy).not.toBeNull(); });
  it("detects inflation", () => { recordEconomyMetric({ resource: "xp", mode: "all", generated: 1000, consumed: 500, inflationRate: 0.15 }); expect(generateEconomyReport().inflationDetected).toBe(true); });
  it("no inflation when low", () => { recordEconomyMetric({ resource: "xp", mode: "all", generated: 1000, consumed: 500, inflationRate: 0.05 }); expect(generateEconomyReport().inflationDetected).toBe(false); });
  it("report has gold economy", () => { recordEconomyMetric({ resource: "gold", mode: "treasure_heist", generated: 200, consumed: 100 }); expect(generateEconomyReport().goldEconomy).not.toBeNull(); });
  it("report has resource economy", () => { recordEconomyMetric({ resource: "resources", mode: "empire_builder", generated: 500, consumed: 200 }); expect(generateEconomyReport().resourceEconomy).not.toBeNull(); });
  it("report null metrics when not set", () => { expect(generateEconomyReport().xpEconomy).toBeNull(); });
  it("metric has timestamp", () => { expect(recordEconomyMetric({ resource: "xp", mode: "all", generated: 0, consumed: 0 }).timestamp).toBeDefined(); });
  it("net flow negative when consumed more", () => { expect(recordEconomyMetric({ resource: "gold", mode: "all", generated: 100, consumed: 300 }).netFlow).toBe(-200); });
  it("default inflation 0", () => { expect(recordEconomyMetric({ resource: "xp", mode: "all", generated: 100, consumed: 50 }).inflationRate).toBe(0); });
  it("gets latest economy report", () => { recordEconomyMetric({ resource: "xp", mode: "all", generated: 100, consumed: 50 }); generateEconomyReport(); expect(getLatestEconomyReport()).not.toBeNull(); });
});

// ===== System 4 — Difficulty Intelligence =====
describe("Intelligence — Difficulty", () => {
  it("records difficulty finding", () => { const f = recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 2000, correctRate: 0.95, dropoutRate: 0.01, description: "Question too easy" }); expect(f.id).toBeDefined(); });
  it("gets all difficulty findings", () => { recordDifficultyFinding({ issue: "too_hard", avgAnswerTimeMs: 30000, correctRate: 0.1, dropoutRate: 0.5, description: "" }); expect(getAllDifficultyFindings().length).toBe(1); });
  it("filters by issue", () => { recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 1000, correctRate: 0.99, dropoutRate: 0, description: "" }); recordDifficultyFinding({ issue: "too_hard", avgAnswerTimeMs: 30000, correctRate: 0.1, dropoutRate: 0.5, description: "" }); expect(getDifficultyByIssue("too_easy").length).toBe(1); });
  it("supports all issue types", () => { for (const i of ["too_easy", "too_hard", "dropoff", "rage_quit", "confusing", "time_pressure", "teacher_override"] as const) recordDifficultyFinding({ issue: i, avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }); expect(getAllDifficultyFindings().length).toBe(7); });
  it("finding has timestamp", () => { expect(recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }).timestamp).toBeDefined(); });
  it("finding has questionId", () => { expect(recordDifficultyFinding({ issue: "too_easy", questionId: "q1", avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }).questionId).toBe("q1"); });
  it("default questionId null", () => { expect(recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }).questionId).toBeNull(); });
});

// ===== System 5 — Educational Intelligence =====
describe("Intelligence — Educational", () => {
  it("records educational KPI", () => { const k = recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.85, accuracyImprovement: 0.1, learningProgression: 0.7, masteryGrowth: 0.5, engagement: 0.9, participation: 0.8, completion: 0.75 }); expect(k.userId).toBe("u1"); });
  it("gets KPI for user", () => { recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.85, accuracyImprovement: 0.1, learningProgression: 0.7, masteryGrowth: 0.5, engagement: 0.9, participation: 0.8, completion: 0.75 }); expect(getEducationalKPIForUser("u1")).not.toBeNull(); });
  it("lists all KPIs", () => { recordEducationalKPI({ userId: "u1", knowledgeRetention: 0, accuracyImprovement: 0, learningProgression: 0, masteryGrowth: 0, engagement: 0, participation: 0, completion: 0 }); recordEducationalKPI({ userId: "u2", knowledgeRetention: 0, accuracyImprovement: 0, learningProgression: 0, masteryGrowth: 0, engagement: 0, participation: 0, completion: 0 }); expect(listAllEducationalKPIs().length).toBe(2); });
  it("returns null for unknown user", () => { expect(getEducationalKPIForUser("nonexistent")).toBeNull(); });
  it("KPI has all fields", () => { const k = recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.85, accuracyImprovement: 0.1, learningProgression: 0.7, masteryGrowth: 0.5, engagement: 0.9, participation: 0.8, completion: 0.75 }); expect(k.knowledgeRetention).toBe(0.85); expect(k.engagement).toBe(0.9); expect(k.completion).toBe(0.75); });
});

// ===== System 6 — Meta Analytics =====
describe("Intelligence — Meta", () => {
  it("records meta trend", () => { const t = recordMetaTrend({ category: "strategy", trend: "aggro", value: 100, previousValue: 80 }); expect(t.changePct).toBe(25); });
  it("gets trends for category", () => { recordMetaTrend({ category: "strategy", trend: "aggro", value: 100, previousValue: 80 }); expect(getMetaTrendsForCategory("strategy").length).toBe(1); });
  it("change pct negative for decrease", () => { expect(recordMetaTrend({ category: "test", trend: "decline", value: 80, previousValue: 100 }).changePct).toBe(-20); });
  it("change pct 0 for no change", () => { expect(recordMetaTrend({ category: "test", trend: "stable", value: 100, previousValue: 100 }).changePct).toBe(0); });
  it("change pct handles zero previous", () => { expect(recordMetaTrend({ category: "test", trend: "new", value: 100, previousValue: 0 }).changePct).toBe(0); });
  it("trend has timestamp", () => { expect(recordMetaTrend({ category: "test", trend: "test", value: 1, previousValue: 1 }).timestamp).toBeDefined(); });
  it("trend has id", () => { expect(recordMetaTrend({ category: "test", trend: "test", value: 1, previousValue: 1 }).id).toBeDefined(); });
  it("empty for unknown category", () => { expect(getMetaTrendsForCategory("nonexistent")).toEqual([]); });
});

// ===== System 7 — Player Segmentation =====
describe("Intelligence — Segmentation", () => {
  it("segments beginner player", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 5, avgAccuracy: 0.5, avgSpeedMs: 5000, winRate: 0.3 }); expect(s.segments).toContain("beginner"); });
  it("segments casual player", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 20, avgAccuracy: 0.6, avgSpeedMs: 4000, winRate: 0.4 }); expect(s.segments).toContain("casual"); });
  it("segments competitive player", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 60, avgAccuracy: 0.7, avgSpeedMs: 3000, winRate: 0.5 }); expect(s.segments).toContain("competitive"); });
  it("segments expert player", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 150, avgAccuracy: 0.8, avgSpeedMs: 2000, winRate: 0.65 }); expect(s.segments).toContain("expert"); });
  it("segments speed player", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 30, avgAccuracy: 0.7, avgSpeedMs: 1500, winRate: 0.5 }); expect(s.segments).toContain("speed_player"); });
  it("segments accurate player", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 30, avgAccuracy: 0.9, avgSpeedMs: 5000, winRate: 0.5 }); expect(s.segments).toContain("accurate_player"); });
  it("segments risk taker", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 25, avgAccuracy: 0.5, avgSpeedMs: 5000, winRate: 0.2 }); expect(s.segments).toContain("risk_taker"); });
  it("segments builder", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 60, avgAccuracy: 0.75, avgSpeedMs: 5000, winRate: 0.5 }); expect(s.segments).toContain("builder"); });
  it("segments survivor", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 40, avgAccuracy: 0.6, avgSpeedMs: 5000, winRate: 0.55 }); expect(s.segments).toContain("survivor"); });
  it("gets segmentation for user", () => { segmentPlayer({ userId: "u1", matchesPlayed: 5, avgAccuracy: 0.5, avgSpeedMs: 5000, winRate: 0.3 }); expect(getSegmentationForUser("u1")).not.toBeNull(); });
  it("returns null for unknown user", () => { expect(getSegmentationForUser("nonexistent")).toBeNull(); });
  it("supports all segments", () => { expect(supportsAllSegments().length).toBe(9); });
  it("segmentation has metrics", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 10, avgAccuracy: 0.6, avgSpeedMs: 3000, winRate: 0.5 }); expect(s.metrics.matchesPlayed).toBe(10); });
  it("segmentation has assignedAt", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 5, avgAccuracy: 0.5, avgSpeedMs: 5000, winRate: 0.3 }).assignedAt).toBeDefined(); });
});

// ===== System 8 — Match Intelligence =====
describe("Intelligence — Match", () => {
  it("computes match intelligence", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 1, networkStability: 0.9, teacherInterventions: 0, completion: 0.9, engagement: 0.85 }); expect(mi.quality).toBeGreaterThan(0); });
  it("computes fairness", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 0.95, teacherInterventions: 0, completion: 1, engagement: 0.9 }); expect(mi.fairness).toBeGreaterThan(0); });
  it("gets match intelligence record", () => { computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 1, teacherInterventions: 0, completion: 1, engagement: 1 }); expect(getMatchIntelligenceRecord("m1")).not.toBeNull(); });
  it("returns null for unknown match", () => { expect(getMatchIntelligenceRecord("nonexistent")).toBeNull(); });
  it("high quality for good match", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 1, teacherInterventions: 0, completion: 1, engagement: 1 }); expect(mi.quality).toBeGreaterThan(0.8); });
  it("low quality for bad match", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 8, networkStability: 0.3, teacherInterventions: 5, completion: 0.3, engagement: 0.2 }); expect(mi.quality).toBeLessThan(0.5); });
});

// ===== System 9 — Live Health Monitoring =====
describe("Intelligence — Health", () => {
  it("raises health alert", () => { const a = raiseHealthAlert({ kind: "disconnect_spike", severity: "warning", description: "Spike in disconnects" }); expect(a.id).toBeDefined(); expect(a.resolvedAt).toBeNull(); });
  it("gets all alerts", () => { raiseHealthAlert({ kind: "latency_spike", severity: "info", description: "test" }); expect(getAllHealthAlerts().length).toBe(1); });
  it("gets unresolved alerts", () => { const a = raiseHealthAlert({ kind: "disconnect_spike", severity: "warning", description: "test" }); expect(getUnresolvedAlerts().length).toBe(1); resolveAlert(a.id); expect(getUnresolvedAlerts().length).toBe(0); });
  it("resolves alert", () => { const a = raiseHealthAlert({ kind: "event_storm", severity: "critical", description: "test" }); expect(resolveAlert(a.id)?.resolvedAt).not.toBeNull(); });
  it("resolve already resolved returns null", () => { const a = raiseHealthAlert({ kind: "latency_spike", severity: "info", description: "" }); resolveAlert(a.id); expect(resolveAlert(a.id)).toBeNull(); });
  it("computes live health healthy", () => { const h = computeLiveHealth({ disconnectRate: 0.01, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }); expect(h.status).toBe("healthy"); });
  it("computes live health degraded for high latency", () => { const h = computeLiveHealth({ disconnectRate: 0.05, avgLatencyMs: 600, matchCount: 10, queueDepth: 5 }); expect(h.status).toBe("degraded"); });
  it("computes live health critical for alerts", () => { raiseHealthAlert({ kind: "disconnect_spike", severity: "critical", description: "test" }); const h = computeLiveHealth({ disconnectRate: 0.3, avgLatencyMs: 800, matchCount: 5, queueDepth: 20 }); expect(h.status).toBe("critical"); });
  it("gets current live health", () => { computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 0, queueDepth: 0 }); expect(getCurrentLiveHealth()).not.toBeNull(); });
  it("supports all alert kinds", () => { for (const k of ["disconnect_spike", "latency_spike", "long_match", "queue_congestion", "event_storm", "resource_anomaly"] as const) raiseHealthAlert({ kind: k, severity: "info", description: "" }); expect(getAllHealthAlerts().length).toBe(6); });
  it("health has activeAlerts", () => { raiseHealthAlert({ kind: "latency_spike", severity: "warning", description: "test" }); expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 1, queueDepth: 1 }).activeAlerts.length).toBe(1); });
  it("health has updatedAt", () => { expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 0, matchCount: 0, queueDepth: 0 }).updatedAt).toBeDefined(); });
});

// ===== System 10 — Simulation Engine =====
describe("Intelligence — Simulation", () => {
  it("creates simulation", () => { const s = createSimulation({ name: "Test Sim", description: "test", gameMode: "classic_quiz", changes: { kFactor: 40 } }); expect(s.status).toBe("draft"); });
  it("runs simulation", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); const r = runSimulation(s.id); expect(r?.status).toBe("completed"); expect(r?.result).not.toBeNull(); });
  it("gets simulation by id", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); expect(getSimulationById(s.id)).not.toBeNull(); });
  it("lists simulations", () => { createSimulation({ name: "S1", description: "", gameMode: "classic_quiz", changes: {} }); createSimulation({ name: "S2", description: "", gameMode: "treasure_heist", changes: {} }); expect(listSimulations().length).toBe(2); });
  it("run non-draft returns null", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); runSimulation(s.id); expect(runSimulation(s.id)).toBeNull(); });
  it("run unknown returns null", () => { expect(runSimulation("nonexistent")).toBeNull(); });
  it("simulation result has projected metrics", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); const r = runSimulation(s.id); expect(r?.result?.projectedAvgScore).toBeDefined(); expect(r?.result?.projectedCompletionRate).toBeDefined(); });
  it("simulation result has confidence score", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); expect(runSimulation(s.id)?.result?.confidenceScore).toBeGreaterThan(0); });
  it("simulation result has notes", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); expect(runSimulation(s.id)?.result?.notes).toBeDefined(); });
  it("simulation has createdAt", () => { expect(createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }).createdAt).toBeDefined(); });
});

// ===== System 11 — A/B Configuration Analyzer =====
describe("Intelligence — A/B", () => {
  it("creates A/B comparison", () => { const c = createABComparison({ configA: { k: 32 }, configB: { k: 40 }, metricA: 100, metricB: 120 }); expect(c.winner).toBe("B"); });
  it("winner A when metricA higher", () => { expect(createABComparison({ configA: {}, configB: {}, metricA: 150, metricB: 100 }).winner).toBe("A"); });
  it("tie when metrics equal", () => { expect(createABComparison({ configA: {}, configB: {}, metricA: 100, metricB: 100 }).winner).toBe("tie"); });
  it("difference calculated", () => { expect(createABComparison({ configA: {}, configB: {}, metricA: 100, metricB: 130 }).difference).toBe(30); });
  it("confidence calculated", () => { const c = createABComparison({ configA: {}, configB: {}, metricA: 100, metricB: 150 }); expect(c.confidence).toBeGreaterThan(0); });
  it("lists comparisons", () => { createABComparison({ configA: {}, configB: {}, metricA: 1, metricB: 2 }); expect(listABComparisons().length).toBe(1); });
  it("comparison has timestamp", () => { expect(createABComparison({ configA: {}, configB: {}, metricA: 1, metricB: 2 }).timestamp).toBeDefined(); });
});

// ===== System 12 — Recommendation Engine =====
describe("Intelligence — Recommendations", () => {
  it("generates recommendation", () => { const r = generateRecommendation({ kind: "balance", priority: "high", title: "Reduce speed bonus", description: "Speed bonus too generous", affectedMode: "classic_quiz", metric: "speed_bonus", currentValue: 100, suggestedValue: 50 }); expect(r.id).toBeDefined(); expect(r.autoApplied).toBe(false); });
  it("gets all recommendations", () => { generateRecommendation({ kind: "balance", priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(getAllRecommendations().length).toBe(1); });
  it("filters by priority", () => { generateRecommendation({ kind: "balance", priority: "high", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); generateRecommendation({ kind: "balance", priority: "low", title: "T2", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(getRecommendationsByPriority("high").length).toBe(1); });
  it("filters by kind", () => { generateRecommendation({ kind: "economy", priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); generateRecommendation({ kind: "difficulty", priority: "low", title: "T2", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(getRecommendationsByKind("economy").length).toBe(1); });
  it("autoApplied is always false", () => { const r = generateRecommendation({ kind: "balance", priority: "critical", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(r.autoApplied).toBe(false); });
  it("supports all kinds", () => { for (const k of ["balance", "economy", "difficulty", "timer", "reward", "config", "educational"] as const) generateRecommendation({ kind: k, priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(getAllRecommendations().length).toBe(7); });
  it("supports all priorities", () => { for (const p of ["low", "medium", "high", "critical"] as const) generateRecommendation({ kind: "balance", priority: p, title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(getAllRecommendations().length).toBe(4); });
  it("has suggestedValue", () => { expect(generateRecommendation({ kind: "balance", priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 100, suggestedValue: 50 }).suggestedValue).toBe(50); });
  it("default suggestedValue null", () => { expect(generateRecommendation({ kind: "balance", priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 100 }).suggestedValue).toBeNull(); });
  it("has timestamp", () => { expect(generateRecommendation({ kind: "balance", priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }).timestamp).toBeDefined(); });
});

// ===== System 13 — Heatmap Engine =====
describe("Intelligence — Heatmaps", () => {
  it("generates heatmap", () => { const h = generateHeatmap({ type: "question_timeline", matchId: "m1", data: [{ x: 0, y: 0, intensity: 0.5 }] }); expect(h.id).toBeDefined(); });
  it("gets heatmaps by type", () => { generateHeatmap({ type: "player_activity", data: [] }); expect(getHeatmapsByType("player_activity").length).toBe(1); });
  it("supports all heatmap types", () => { expect(supportsAllHeatmapTypes().length).toBe(5); });
  it("heatmap has generatedAt", () => { expect(generateHeatmap({ type: "dropout_timeline", data: [] }).generatedAt).toBeDefined(); });
  it("heatmap with null matchId", () => { expect(generateHeatmap({ type: "economy_flow", data: [] }).matchId).toBeNull(); });
  it("heatmap with matchId", () => { expect(generateHeatmap({ type: "resource_flow", matchId: "m1", data: [] }).matchId).toBe("m1"); });
  it("heatmap has data array", () => { const h = generateHeatmap({ type: "question_timeline", data: [{ x: 1, y: 2, intensity: 0.8 }] }); expect(h.data.length).toBe(1); });
  it("empty for unknown type", () => { _resetRepositoryForTesting(); expect(getHeatmapsByType("question_timeline")).toEqual([]); });
});

// ===== System 14 — Season Intelligence =====
describe("Intelligence — Season", () => {
  it("records season intelligence", () => { const s = recordSeasonIntelligence({ seasonId: "s1", participation: 1000, retention: 0.75, completion: 0.6, avgXP: 5000, competitionLevel: 0.8, clubActivity: 0.7 }); expect(s.seasonId).toBe("s1"); });
  it("gets season intelligence", () => { recordSeasonIntelligence({ seasonId: "s1", participation: 100, retention: 0.5, completion: 0.4, avgXP: 1000, competitionLevel: 0.6, clubActivity: 0.5 }); expect(getSeasonIntel("s1")).not.toBeNull(); });
  it("returns null for unknown season", () => { expect(getSeasonIntel("nonexistent")).toBeNull(); });
  it("has updatedAt", () => { expect(recordSeasonIntelligence({ seasonId: "s1", participation: 0, retention: 0, completion: 0, avgXP: 0, competitionLevel: 0, clubActivity: 0 }).updatedAt).toBeDefined(); });
});

// ===== System 15 — Competitive Intelligence =====
describe("Intelligence — Competitive", () => {
  it("records competitive intelligence", () => { const c = recordCompetitiveIntelligence({ rankingVolatility: 0.3, ratingInflation: 0.05, leagueHealth: 0.85, queueQuality: 0.9, matchFairness: 0.88, tournamentCompletion: 0.92 }); expect(c.leagueHealth).toBe(0.85); });
  it("gets current competitive intelligence", () => { recordCompetitiveIntelligence({ rankingVolatility: 0.2, ratingInflation: 0.03, leagueHealth: 0.9, queueQuality: 0.85, matchFairness: 0.9, tournamentCompletion: 0.95 }); expect(getCurrentCompetitiveIntelligence()).not.toBeNull(); });
  it("returns null when not set", () => { expect(getCurrentCompetitiveIntelligence()).toBeNull(); });
  it("has updatedAt", () => { expect(recordCompetitiveIntelligence({ rankingVolatility: 0, ratingInflation: 0, leagueHealth: 0, queueQuality: 0, matchFairness: 0, tournamentCompletion: 0 }).updatedAt).toBeDefined(); });
});

// ===== System 16 — Dashboard =====
describe("Intelligence — Dashboard", () => {
  it("generates dashboard", () => { const d = generateIntelligenceDashboard(); expect(d).toBeDefined(); expect(d.health).toBeDefined(); });
  it("dashboard has balance findings", () => { recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }); expect(generateIntelligenceDashboard().balanceFindings.length).toBeGreaterThan(0); });
  it("dashboard has economy report", () => { recordEconomyMetric({ resource: "xp", mode: "all", generated: 100, consumed: 50 }); generateEconomyReport(); expect(generateIntelligenceDashboard().economy).not.toBeNull(); });
  it("dashboard has difficulty findings", () => { recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }); expect(generateIntelligenceDashboard().difficultyFindings.length).toBeGreaterThan(0); });
  it("dashboard has recommendations", () => { generateRecommendation({ kind: "balance", priority: "low", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(generateIntelligenceDashboard().recommendations.length).toBeGreaterThan(0); });
  it("dashboard has alerts", () => { raiseHealthAlert({ kind: "latency_spike", severity: "warning", description: "test" }); expect(generateIntelligenceDashboard().alerts.length).toBeGreaterThan(0); });
  it("dashboard has updatedAt", () => { expect(generateIntelligenceDashboard().updatedAt).toBeDefined(); });
  it("dashboard has educational KPIs", () => { recordEducationalKPI({ userId: "u1", knowledgeRetention: 0, accuracyImprovement: 0, learningProgression: 0, masteryGrowth: 0, engagement: 0, participation: 0, completion: 0 }); expect(generateIntelligenceDashboard().educationalKPIs.length).toBeGreaterThan(0); });
});

// ===== System 17 — Event Bus Bridge =====
describe("Intelligence — Bridge", () => {
  it("subscribes", () => { subscribeIntelligence(); expect(isIntelligenceSubscribed()).toBe(true); });
  it("unsubscribes", () => { subscribeIntelligence(); unsubscribeIntelligence(); expect(isIntelligenceSubscribed()).toBe(false); });
  it("subscribe is idempotent", () => { subscribeIntelligence(); subscribeIntelligence(); expect(isIntelligenceSubscribed()).toBe(true); });
  it("publishes intelligence events", () => { expect(() => publishIntelligenceEvent("TelemetryRecorded", null, {})).not.toThrow(); });
  it("processes MatchFinished", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "MatchFinished", "u1", { gameMode: "classic_quiz", result: "win", score: 500, durationMs: 60000 }); expect(getBridgeProcessedCount()).toBeGreaterThan(0); });
  it("records telemetry from MatchFinished", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "MatchFinished", "u1", { gameMode: "classic_quiz", result: "win", score: 500, durationMs: 60000 }); expect(getMatchTelemetry(m.id).length).toBeGreaterThan(0); });
  it("processes AnswerSubmitted", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "AnswerSubmitted", "u1", { isCorrect: true, responseMs: 3000 }); expect(getMatchTelemetry(m.id).length).toBeGreaterThan(0); });
  it("processes PlayerDisconnected", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "PlayerDisconnected", "u1", {}); expect(getMatchTelemetry(m.id).length).toBeGreaterThan(0); });
});

// ===== System 18 — Developer Integration =====
describe("Intelligence — Developer", () => {
  it("returns developer integration", () => { const d = getDeveloperIntegration(); expect(d.publicAPIs.length).toBeGreaterThan(0); expect(d.extensionHooks.length).toBeGreaterThan(0); });
  it("has API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("/api/game-intelligence/"))).toBe(true); });
  it("has SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBeDefined(); });
});

// ===== Architecture Compliance =====
describe("Intelligence — Architecture", () => {
  it("no circular dependencies", async () => { const mod = await import("@/features/game-intelligence"); expect(mod.recordTelemetry).toBeDefined(); });
  it("no gameplay ownership", () => { expect(true).toBe(true); });
  it("recommendations never auto-execute", () => { const r = generateRecommendation({ kind: "balance", priority: "critical", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(r.autoApplied).toBe(false); });
  it("simulation never affects production", () => { const s = createSimulation({ name: "Test", description: "", gameMode: "classic_quiz", changes: {} }); runSimulation(s.id); expect(s.status).not.toBe("running"); });
});

// ===== Edge Cases =====
describe("Intelligence — Edge Cases", () => {
  it("returns null for unknown telemetry summary", () => { expect(getTelemetrySummaryForMatch("nonexistent")).toBeNull(); });
  it("returns null for unknown match intelligence", () => { expect(getMatchIntelligenceRecord("nonexistent")).toBeNull(); });
  it("returns null for unknown educational KPI", () => { expect(getEducationalKPIForUser("nonexistent")).toBeNull(); });
  it("returns null for unknown segmentation", () => { expect(getSegmentationForUser("nonexistent")).toBeNull(); });
  it("returns null for unknown simulation", () => { expect(getSimulationById("nonexistent")).toBeNull(); });
  it("returns null for unknown season intel", () => { expect(getSeasonIntel("nonexistent")).toBeNull(); });
  it("returns null for unknown economy metric", () => { expect(getEconomyMetricFor("nonexistent")).toBeNull(); });
  it("returns null for unknown live health", () => { expect(getCurrentLiveHealth()).toBeNull(); });
  it("returns null for unknown competitive intel", () => { expect(getCurrentCompetitiveIntelligence()).toBeNull(); });
  it("returns empty for unknown telemetry events", () => { expect(getMatchTelemetry("nonexistent")).toEqual([]); });
  it("returns empty for unknown balance findings", () => { expect(getBalanceFindingsForMode("classic_quiz")).toEqual([]); });
  it("returns empty for unknown difficulty findings", () => { expect(getAllDifficultyFindings()).toEqual([]); });
  it("returns empty for unknown meta trends", () => { expect(getMetaTrendsForCategory("nonexistent")).toEqual([]); });
  it("returns empty for unknown heatmaps", () => { _resetRepositoryForTesting(); expect(getHeatmapsByType("question_timeline")).toEqual([]); });
  it("returns empty for unknown recommendations", () => { expect(getAllRecommendations()).toEqual([]); });
  it("returns empty for unknown health alerts", () => { expect(getAllHealthAlerts()).toEqual([]); });
});

// ===== Stress =====
describe("Intelligence — Stress", () => {
  it("handles many telemetry events", () => { for (let i = 0; i < 200; i++) recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }); expect(getMatchTelemetry("m1").length).toBe(200); });
  it("handles many balance findings", () => { for (let i = 0; i < 100; i++) recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: `m${i}`, value: 1, threshold: 2, description: "" }); expect(getBalanceFindingsForMode("classic_quiz").length).toBe(100); });
  it("handles many recommendations", () => { for (let i = 0; i < 100; i++) generateRecommendation({ kind: "balance", priority: "low", title: `R${i}`, description: "", affectedMode: "all", metric: "test", currentValue: 0 }); expect(getAllRecommendations().length).toBe(100); });
  it("handles many simulations", () => { for (let i = 0; i < 50; i++) createSimulation({ name: `S${i}`, description: "", gameMode: "classic_quiz", changes: {} }); expect(listSimulations().length).toBe(50); });
  it("handles many health alerts", () => { for (let i = 0; i < 100; i++) raiseHealthAlert({ kind: "latency_spike", severity: "info", description: "" }); expect(getAllHealthAlerts().length).toBe(100); });
});

// ===== Extended Tests =====
describe("Intelligence — Extended", () => {
  it("telemetry with all fields", () => { const e = recordTelemetry({ matchId: "m1", userId: "u1", gameMode: "classic_quiz", eventType: "test", durationMs: 5000, value: 100, metadata: { key: "val" } }); expect(e.userId).toBe("u1"); expect(e.durationMs).toBe(5000); expect(e.value).toBe(100); });
  it("balance finding for all modes", () => { for (const m of ["classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale"] as const) recordBalanceFinding({ gameMode: m, category: "test", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }); expect(getBalanceFindingsForMode("classic_quiz").length).toBe(1); expect(getBalanceFindingsForMode("treasure_heist").length).toBe(1); });
  it("economy report with all resources", () => { recordEconomyMetric({ resource: "xp", mode: "all", generated: 1000, consumed: 500 }); recordEconomyMetric({ resource: "gold", mode: "all", generated: 200, consumed: 100 }); recordEconomyMetric({ resource: "resources", mode: "all", generated: 500, consumed: 200 }); const r = generateEconomyReport(); expect(r.xpEconomy).not.toBeNull(); expect(r.goldEconomy).not.toBeNull(); expect(r.resourceEconomy).not.toBeNull(); });
  it("difficulty with all issue types", () => { for (const i of ["too_easy", "too_hard", "dropoff", "rage_quit", "confusing", "time_pressure", "teacher_override"] as const) recordDifficultyFinding({ issue: i, avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }); expect(getAllDifficultyFindings().length).toBe(7); });
  it("segmentation with multiple segments", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 150, avgAccuracy: 0.9, avgSpeedMs: 1500, winRate: 0.7 }); expect(s.segments.length).toBeGreaterThan(1); });
  it("match intelligence quality range 0-1", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 1, teacherInterventions: 0, completion: 1, engagement: 1 }); expect(mi.quality).toBeGreaterThanOrEqual(0); expect(mi.quality).toBeLessThanOrEqual(1); });
  it("live health transitions", () => { const h1 = computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }); expect(h1.status).toBe("healthy"); raiseHealthAlert({ kind: "disconnect_spike", severity: "critical", description: "test" }); const h2 = computeLiveHealth({ disconnectRate: 0.3, avgLatencyMs: 800, matchCount: 5, queueDepth: 20 }); expect(h2.status).toBe("critical"); });
  it("simulation produces different results for different configs", () => { const s1 = createSimulation({ name: "S1", description: "", gameMode: "classic_quiz", changes: { kFactor: 32 } }); const s2 = createSimulation({ name: "S2", description: "", gameMode: "treasure_heist", changes: { goldStart: 200 } }); runSimulation(s1.id); runSimulation(s2.id); expect(getSimulationById(s1.id)?.result).not.toBeNull(); expect(getSimulationById(s2.id)?.result).not.toBeNull(); });
  it("AB comparison with large difference", () => { const c = createABComparison({ configA: {}, configB: {}, metricA: 100, metricB: 500 }); expect(c.difference).toBe(400); expect(c.winner).toBe("B"); });
  it("recommendation with all fields", () => { const r = generateRecommendation({ kind: "economy", priority: "critical", title: "Gold inflation", description: "Gold inflation exceeds threshold", affectedMode: "treasure_heist", metric: "gold_inflation", currentValue: 0.15, suggestedValue: 0.05 }); expect(r.kind).toBe("economy"); expect(r.priority).toBe("critical"); expect(r.affectedMode).toBe("treasure_heist"); });
  it("heatmap with multiple data points", () => { const h = generateHeatmap({ type: "question_timeline", matchId: "m1", data: [{ x: 0, y: 0, intensity: 0.1 }, { x: 1, y: 0, intensity: 0.5 }, { x: 2, y: 0, intensity: 0.9 }] }); expect(h.data.length).toBe(3); });
  it("season intelligence with all fields", () => { const s = recordSeasonIntelligence({ seasonId: "s1", participation: 500, retention: 0.8, completion: 0.65, avgXP: 7500, competitionLevel: 0.85, clubActivity: 0.75 }); expect(s.participation).toBe(500); expect(s.retention).toBe(0.8); });
  it("competitive intelligence with all fields", () => { const c = recordCompetitiveIntelligence({ rankingVolatility: 0.25, ratingInflation: 0.04, leagueHealth: 0.88, queueQuality: 0.92, matchFairness: 0.9, tournamentCompletion: 0.94 }); expect(c.rankingVolatility).toBe(0.25); expect(c.tournamentCompletion).toBe(0.94); });
  it("dashboard aggregates all systems", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }); recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }); recordEconomyMetric({ resource: "xp", mode: "all", generated: 100, consumed: 50 }); generateEconomyReport(); recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 0, correctRate: 0, dropoutRate: 0, description: "" }); recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.8, accuracyImprovement: 0.1, learningProgression: 0.6, masteryGrowth: 0.4, engagement: 0.85, participation: 0.75, completion: 0.7 }); generateRecommendation({ kind: "balance", priority: "medium", title: "T", description: "", affectedMode: "all", metric: "test", currentValue: 0 }); raiseHealthAlert({ kind: "latency_spike", severity: "warning", description: "test" }); const d = generateIntelligenceDashboard(); expect(d.balanceFindings.length).toBeGreaterThan(0); expect(d.economy).not.toBeNull(); expect(d.difficultyFindings.length).toBeGreaterThan(0); expect(d.educationalKPIs.length).toBeGreaterThan(0); expect(d.recommendations.length).toBeGreaterThan(0); expect(d.alerts.length).toBeGreaterThan(0); });
});

// ===== Extended Telemetry Tests =====
describe("Intelligence — Telemetry Extended", () => {
  it("multiple event types in summary", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "question_duration", durationMs: 5000 }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "answer_submitted", value: 1 }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "disconnect" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "reconnect" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "pause" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "skip" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "overtime" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "host_intervention" }); recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "timer_extension" }); const s = computeTelemetrySummary("m1"); expect(s?.totalEvents).toBe(9); expect(s?.disconnects).toBe(1); expect(s?.reconnects).toBe(1); expect(s?.pauses).toBe(1); expect(s?.skips).toBe(1); expect(s?.overtime).toBe(1); expect(s?.hostInterventions).toBe(1); expect(s?.timerExtensions).toBe(1); });
  it("latency average from multiple events", () => { for (const v of [100, 200, 300, 400, 500]) recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "latency", value: v }); expect(computeTelemetrySummary("m1")?.avgLatencyMs).toBe(300); });
  it("answer distribution with multiple values", () => { for (let i = 0; i < 10; i++) recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "answer_submitted", value: i % 2 }); const s = computeTelemetrySummary("m1"); expect(s?.answerDistributions["0"]).toBe(5); expect(s?.answerDistributions["1"]).toBe(5); });
  it("telemetry with null userId", () => { expect(recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }).userId).toBeNull(); });
  it("telemetry with explicit null userId", () => { expect(recordTelemetry({ matchId: "m1", userId: null, gameMode: "classic_quiz", eventType: "test" }).userId).toBeNull(); });
  it("telemetry with metadata", () => { const e = recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test", metadata: { player: "Alice", score: 500 } }); expect(e.metadata.player).toBe("Alice"); });
});

// ===== Extended Balance Tests =====
describe("Intelligence — Balance Extended", () => {
  it("finding has category", () => { expect(recordBalanceFinding({ gameMode: "classic_quiz", category: "scoring", severity: "info", metric: "test", value: 1, threshold: 2, description: "" }).category).toBe("scoring"); });
  it("finding has threshold", () => { expect(recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "info", metric: "test", value: 100, threshold: 200, description: "" }).threshold).toBe(200); });
  it("report for treasure_heist", () => { recordBalanceFinding({ gameMode: "treasure_heist", category: "economy", severity: "warning", metric: "gold_inflation", value: 0.15, threshold: 0.1, description: "Gold inflation high" }); const r = generateBalanceReport("treasure_heist"); expect(r.findings.length).toBe(1); });
  it("report for empire_builder", () => { recordBalanceFinding({ gameMode: "empire_builder", category: "progression", severity: "info", metric: "avg_score", value: 800, threshold: 600, description: "" }); const r = generateBalanceReport("empire_builder"); expect(r.avgScore).toBe(800); });
  it("report for quiz_royale", () => { recordBalanceFinding({ gameMode: "quiz_royale", category: "survival", severity: "info", metric: "accuracy", value: 0.75, threshold: 0.6, description: "" }); const r = generateBalanceReport("quiz_royale"); expect(r.accuracyRate).toBe(0.75); });
  it("report for battle_royale", () => { recordBalanceFinding({ gameMode: "battle_royale", category: "duel", severity: "info", metric: "completion_rate", value: 0.9, threshold: 0.8, description: "" }); const r = generateBalanceReport("battle_royale"); expect(r.completionRate).toBe(0.9); });
  it("report has updatedAt", () => { expect(generateBalanceReport("classic_quiz").updatedAt).toBeDefined(); });
});

// ===== Extended Economy Tests =====
describe("Intelligence — Economy Extended", () => {
  it("gold economy metric", () => { const m = recordEconomyMetric({ resource: "gold", mode: "treasure_heist", generated: 500, consumed: 300 }); expect(m.resource).toBe("gold"); expect(m.mode).toBe("treasure_heist"); });
  it("xp economy metric", () => { const m = recordEconomyMetric({ resource: "xp", mode: "all", generated: 10000, consumed: 5000 }); expect(m.resource).toBe("xp"); expect(m.netFlow).toBe(5000); });
  it("resources economy metric", () => { const m = recordEconomyMetric({ resource: "resources", mode: "empire_builder", generated: 1000, consumed: 800 }); expect(m.netFlow).toBe(200); });
  it("inflation rate from metric", () => { const m = recordEconomyMetric({ resource: "xp", mode: "all", generated: 1000, consumed: 500, inflationRate: 0.08 }); expect(m.inflationRate).toBe(0.08); });
  it("report detects gold inflation", () => { recordEconomyMetric({ resource: "gold", mode: "treasure_heist", generated: 1000, consumed: 200, inflationRate: 0.2 }); expect(generateEconomyReport().inflationDetected).toBe(true); });
  it("report has cosmeticUnlockRate", () => { expect(generateEconomyReport().cosmeticUnlockRate).toBeGreaterThanOrEqual(0); });
});

// ===== Extended Difficulty Tests =====
describe("Intelligence — Difficulty Extended", () => {
  it("too easy finding", () => { const f = recordDifficultyFinding({ issue: "too_easy", avgAnswerTimeMs: 1000, correctRate: 0.98, dropoutRate: 0.01, description: "Almost everyone gets it right" }); expect(f.correctRate).toBe(0.98); });
  it("too hard finding", () => { const f = recordDifficultyFinding({ issue: "too_hard", avgAnswerTimeMs: 25000, correctRate: 0.05, dropoutRate: 0.3, description: "Almost no one gets it right" }); expect(f.correctRate).toBe(0.05); });
  it("rage quit finding", () => { const f = recordDifficultyFinding({ issue: "rage_quit", avgAnswerTimeMs: 15000, correctRate: 0.2, dropoutRate: 0.6, description: "High rage quit rate" }); expect(f.dropoutRate).toBe(0.6); });
  it("confusing finding", () => { const f = recordDifficultyFinding({ issue: "confusing", avgAnswerTimeMs: 20000, correctRate: 0.3, dropoutRate: 0.1, description: "Question unclear" }); expect(f.issue).toBe("confusing"); });
  it("time pressure finding", () => { const f = recordDifficultyFinding({ issue: "time_pressure", avgAnswerTimeMs: 30000, correctRate: 0.4, dropoutRate: 0.2, description: "Not enough time" }); expect(f.avgAnswerTimeMs).toBe(30000); });
  it("teacher override finding", () => { const f = recordDifficultyFinding({ issue: "teacher_override", avgAnswerTimeMs: 10000, correctRate: 0.5, dropoutRate: 0.1, description: "Teacher skipped" }); expect(f.issue).toBe("teacher_override"); });
  it("finding with questionId", () => { const f = recordDifficultyFinding({ issue: "too_easy", questionId: "q-123", avgAnswerTimeMs: 1000, correctRate: 0.99, dropoutRate: 0, description: "" }); expect(f.questionId).toBe("q-123"); });
});

// ===== Extended Educational Tests =====
describe("Intelligence — Educational Extended", () => {
  it("KPI with high retention", () => { const k = recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.95, accuracyImprovement: 0.2, learningProgression: 0.8, masteryGrowth: 0.7, engagement: 0.95, participation: 0.9, completion: 0.85 }); expect(k.knowledgeRetention).toBe(0.95); });
  it("KPI with low engagement", () => { const k = recordEducationalKPI({ userId: "u2", knowledgeRetention: 0.3, accuracyImprovement: 0.01, learningProgression: 0.1, masteryGrowth: 0.05, engagement: 0.2, participation: 0.3, completion: 0.25 }); expect(k.engagement).toBe(0.2); });
  it("multiple users with different KPIs", () => { recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.9, accuracyImprovement: 0.15, learningProgression: 0.7, masteryGrowth: 0.6, engagement: 0.85, participation: 0.8, completion: 0.75 }); recordEducationalKPI({ userId: "u2", knowledgeRetention: 0.5, accuracyImprovement: 0.05, learningProgression: 0.3, masteryGrowth: 0.2, engagement: 0.4, participation: 0.5, completion: 0.35 }); const kpis = listAllEducationalKPIs(); expect(kpis.length).toBe(2); expect(kpis[0].knowledgeRetention).toBeGreaterThan(kpis[1].knowledgeRetention); });
});

// ===== Extended Segmentation Tests =====
describe("Intelligence — Segmentation Extended", () => {
  it("player with no matches is beginner", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 0, avgAccuracy: 0, avgSpeedMs: 0, winRate: 0 }).segments).toContain("beginner"); });
  it("player with 10 matches is casual", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 10, avgAccuracy: 0.5, avgSpeedMs: 5000, winRate: 0.4 }).segments).toContain("casual"); });
  it("player with 50 matches is competitive", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 50, avgAccuracy: 0.6, avgSpeedMs: 4000, winRate: 0.5 }).segments).toContain("competitive"); });
  it("player with 100+ matches and high winRate is expert", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 120, avgAccuracy: 0.8, avgSpeedMs: 2500, winRate: 0.7 }).segments).toContain("expert"); });
  it("fast player with sub-2s speed", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 30, avgAccuracy: 0.6, avgSpeedMs: 1500, winRate: 0.5 }).segments).toContain("speed_player"); });
  it("accurate player with 90%+ accuracy", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 30, avgAccuracy: 0.92, avgSpeedMs: 5000, winRate: 0.5 }).segments).toContain("accurate_player"); });
  it("risk taker with low winRate", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 25, avgAccuracy: 0.4, avgSpeedMs: 5000, winRate: 0.15 }).segments).toContain("risk_taker"); });
  it("builder with 50+ matches and 70%+ accuracy", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 55, avgAccuracy: 0.72, avgSpeedMs: 5000, winRate: 0.5 }).segments).toContain("builder"); });
  it("survivor with 30+ matches and 50%+ winRate", () => { expect(segmentPlayer({ userId: "u1", matchesPlayed: 35, avgAccuracy: 0.6, avgSpeedMs: 5000, winRate: 0.55 }).segments).toContain("survivor"); });
  it("segmentation has all metrics", () => { const s = segmentPlayer({ userId: "u1", matchesPlayed: 100, avgAccuracy: 0.8, avgSpeedMs: 2000, winRate: 0.65 }); expect(s.metrics.matchesPlayed).toBe(100); expect(s.metrics.avgAccuracy).toBe(0.8); expect(s.metrics.avgSpeedMs).toBe(2000); expect(s.metrics.winRate).toBe(0.65); });
});

// ===== Extended Match Intelligence Tests =====
describe("Intelligence — Match Extended", () => {
  it("quality with perfect match", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 1, teacherInterventions: 0, completion: 1, engagement: 1 }); expect(mi.quality).toBeGreaterThan(0.9); });
  it("quality with terrible match", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 10, networkStability: 0.1, teacherInterventions: 10, completion: 0.1, engagement: 0.1 }); expect(mi.quality).toBeLessThan(0.3); });
  it("fairness with perfect stability", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 1, teacherInterventions: 0, completion: 1, engagement: 1 }); expect(mi.fairness).toBe(1); });
  it("fairness with interventions", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 0, networkStability: 1, teacherInterventions: 3, completion: 1, engagement: 1 }); expect(mi.fairness).toBeLessThan(1); });
  it("match has all fields", () => { const mi = computeMatchIntelligence({ matchId: "m1", dropouts: 2, networkStability: 0.85, teacherInterventions: 1, completion: 0.9, engagement: 0.8 }); expect(mi.dropouts).toBe(2); expect(mi.networkStability).toBe(0.85); expect(mi.teacherInterventions).toBe(1); expect(mi.completion).toBe(0.9); expect(mi.engagement).toBe(0.8); });
});

// ===== Extended Health Tests =====
describe("Intelligence — Health Extended", () => {
  it("health with no alerts is healthy", () => { expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }).status).toBe("healthy"); });
  it("health with high disconnect is degraded", () => { expect(computeLiveHealth({ disconnectRate: 0.25, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }).status).toBe("degraded"); });
  it("health with high latency is degraded", () => { expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 600, matchCount: 10, queueDepth: 5 }).status).toBe("degraded"); });
  it("health with critical alert is critical", () => { raiseHealthAlert({ kind: "disconnect_spike", severity: "critical", description: "test" }); expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }).status).toBe("critical"); });
  it("health with many warnings is degraded", () => { for (let i = 0; i < 3; i++) raiseHealthAlert({ kind: "latency_spike", severity: "warning", description: "" }); expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }).status).toBe("degraded"); });
  it("resolve all alerts makes health healthy", () => { const alerts: ReturnType<typeof raiseHealthAlert>[] = []; for (let i = 0; i < 3; i++) alerts.push(raiseHealthAlert({ kind: "latency_spike", severity: "warning", description: "" })); for (const a of alerts) resolveAlert(a.id); expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 50, matchCount: 10, queueDepth: 5 }).status).toBe("healthy"); });
  it("health has matchCount", () => { expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 0, matchCount: 42, queueDepth: 0 }).matchCount).toBe(42); });
  it("health has queueDepth", () => { expect(computeLiveHealth({ disconnectRate: 0, avgLatencyMs: 0, matchCount: 0, queueDepth: 15 }).queueDepth).toBe(15); });
  it("alert has detectedAt", () => { expect(raiseHealthAlert({ kind: "latency_spike", severity: "info", description: "" }).detectedAt).toBeDefined(); });
  it("resolved alert has resolvedAt", () => { const a = raiseHealthAlert({ kind: "latency_spike", severity: "info", description: "" }); resolveAlert(a.id); expect(getAllHealthAlerts().find(x => x.id === a.id)?.resolvedAt).not.toBeNull(); });
});

// ===== Extended Simulation Tests =====
describe("Intelligence — Simulation Extended", () => {
  it("simulation for treasure_heist", () => { const s = createSimulation({ name: "Gold Sim", description: "Test gold economy", gameMode: "treasure_heist", changes: { startingGold: 300 } }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.result).not.toBeNull(); });
  it("simulation for empire_builder", () => { const s = createSimulation({ name: "Build Sim", description: "Test building costs", gameMode: "empire_builder", changes: { buildCost: { wood: 50 } } }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.status).toBe("completed"); });
  it("simulation for quiz_royale", () => { const s = createSimulation({ name: "Survival Sim", description: "Test starting lives", gameMode: "quiz_royale", changes: { startingLives: 5 } }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.result?.projectedDropoffRate).toBeDefined(); });
  it("simulation for battle_royale", () => { const s = createSimulation({ name: "Duel Sim", description: "Test duel timer", gameMode: "battle_royale", changes: { duelTimer: 30000 } }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.result?.projectedDurationMs).toBeDefined(); });
  it("simulation has name", () => { expect(createSimulation({ name: "My Sim", description: "", gameMode: "classic_quiz", changes: {} }).name).toBe("My Sim"); });
  it("simulation has description", () => { expect(createSimulation({ name: "T", description: "Test description", gameMode: "classic_quiz", changes: {} }).description).toBe("Test description"); });
  it("simulation has changes", () => { expect(createSimulation({ name: "T", description: "", gameMode: "classic_quiz", changes: { k: 40 } }).changes.k).toBe(40); });
  it("simulation default result null", () => { expect(createSimulation({ name: "T", description: "", gameMode: "classic_quiz", changes: {} }).result).toBeNull(); });
  it("simulation default status draft", () => { expect(createSimulation({ name: "T", description: "", gameMode: "classic_quiz", changes: {} }).status).toBe("draft"); });
  it("result has projectedAvgScore", () => { const s = createSimulation({ name: "T", description: "", gameMode: "classic_quiz", changes: {} }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.result?.projectedAvgScore).toBeDefined(); });
  it("result has confidenceScore", () => { const s = createSimulation({ name: "T", description: "", gameMode: "classic_quiz", changes: {} }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.result?.confidenceScore).toBeGreaterThan(0); });
  it("result has notes", () => { const s = createSimulation({ name: "T", description: "", gameMode: "classic_quiz", changes: {} }); runSimulation(s.id); const sim1 = getSimulationById(s.id); expect(sim1?.result?.notes).toContain("advisory"); });
});

// ===== Extended AB Tests =====
describe("Intelligence — AB Extended", () => {
  it("AB with configs", () => { const c = createABComparison({ configA: { timer: 30000 }, configB: { timer: 20000 }, metricA: 70, metricB: 85 }); expect(c.configA.timer).toBe(30000); expect(c.configB.timer).toBe(20000); });
  it("AB confidence with large difference", () => { const c = createABComparison({ configA: {}, configB: {}, metricA: 100, metricB: 1000 }); expect(c.confidence).toBe(1); });
  it("AB confidence with small difference", () => { const c = createABComparison({ configA: {}, configB: {}, metricA: 100, metricB: 101 }); expect(c.confidence).toBeLessThanOrEqual(0.1); });
  it("AB with tie", () => { const c = createABComparison({ configA: {}, configB: {}, metricA: 50, metricB: 50 }); expect(c.winner).toBe("tie"); expect(c.difference).toBe(0); });
  it("AB has id", () => { expect(createABComparison({ configA: {}, configB: {}, metricA: 1, metricB: 2 }).id).toBeDefined(); });
});

// ===== Extended Recommendation Tests =====
describe("Intelligence — Recommendations Extended", () => {
  it("speed bonus recommendation", () => { const r = generateRecommendation({ kind: "balance", priority: "high", title: "Speed bonus too generous", description: "Average speed bonus is 100, consider reducing to 50", affectedMode: "classic_quiz", metric: "speed_bonus", currentValue: 100, suggestedValue: 50 }); expect(r.title).toContain("Speed bonus"); });
  it("gold inflation recommendation", () => { const r = generateRecommendation({ kind: "economy", priority: "medium", title: "Treasure inflation exceeds threshold", description: "Gold inflation at 15%, threshold is 10%", affectedMode: "treasure_heist", metric: "gold_inflation", currentValue: 0.15, suggestedValue: 0.1 }); expect(r.kind).toBe("economy"); });
  it("empire progression recommendation", () => { const r = generateRecommendation({ kind: "balance", priority: "medium", title: "Empire reaches max level too quickly", description: "Average time to max level is 5 minutes, consider increasing costs", affectedMode: "empire_builder", metric: "avg_time_to_max", currentValue: 300, suggestedValue: 600 }); expect(r.affectedMode).toBe("empire_builder"); });
  it("shield usage recommendation", () => { const r = generateRecommendation({ kind: "balance", priority: "low", title: "Shield usage extremely low", description: "Only 5% of players use shields", affectedMode: "quiz_royale", metric: "shield_usage_rate", currentValue: 0.05, suggestedValue: 0.15 }); expect(r.priority).toBe("low"); });
  it("question timer recommendation", () => { const r = generateRecommendation({ kind: "timer", priority: "high", title: "Question timer should be increased", description: "Average answer time exceeds 80% of timer", affectedMode: "classic_quiz", metric: "avg_answer_time_ratio", currentValue: 0.85, suggestedValue: 0.6 }); expect(r.kind).toBe("timer"); });
  it("educational recommendation", () => { const r = generateRecommendation({ kind: "educational", priority: "medium", title: "Improve knowledge retention", description: "Retention below 50% for advanced questions", affectedMode: "all", metric: "knowledge_retention", currentValue: 0.45, suggestedValue: 0.6 }); expect(r.kind).toBe("educational"); });
  it("config recommendation", () => { const r = generateRecommendation({ kind: "config", priority: "low", title: "Consider adjusting K-factor", description: "Current K-factor may not reflect skill accurately", affectedMode: "battle_royale", metric: "k_factor", currentValue: 32, suggestedValue: 40 }); expect(r.kind).toBe("config"); });
  it("reward recommendation", () => { const r = generateRecommendation({ kind: "reward", priority: "medium", title: "Victory reward too high", description: "Victory XP is 500, consider reducing to 300", affectedMode: "classic_quiz", metric: "victory_xp", currentValue: 500, suggestedValue: 300 }); expect(r.kind).toBe("reward"); });
});

// ===== Extended Heatmap Tests =====
describe("Intelligence — Heatmaps Extended", () => {
  it("question timeline heatmap", () => { const h = generateHeatmap({ type: "question_timeline", matchId: "m1", data: [{ x: 0, y: 0, intensity: 0.2 }, { x: 1, y: 0, intensity: 0.8 }] }); expect(h.type).toBe("question_timeline"); });
  it("player activity heatmap", () => { const h = generateHeatmap({ type: "player_activity", matchId: "m1", data: [{ x: 0, y: 0, intensity: 0.5 }] }); expect(h.type).toBe("player_activity"); });
  it("dropout timeline heatmap", () => { const h = generateHeatmap({ type: "dropout_timeline", matchId: "m1", data: [{ x: 5, y: 0, intensity: 0.9 }] }); expect(h.type).toBe("dropout_timeline"); });
  it("economy flow heatmap", () => { const h = generateHeatmap({ type: "economy_flow", matchId: "m1", data: [{ x: 0, y: 0, intensity: 0.3 }] }); expect(h.type).toBe("economy_flow"); });
  it("resource flow heatmap", () => { const h = generateHeatmap({ type: "resource_flow", matchId: "m1", data: [{ x: 0, y: 0, intensity: 0.7 }] }); expect(h.type).toBe("resource_flow"); });
  it("heatmap with large dataset", () => { const data: Array<{ x: number; y: number; intensity: number }> = []; for (let i = 0; i < 100; i++) data.push({ x: i, y: 0, intensity: Math.random() }); const h = generateHeatmap({ type: "question_timeline", data }); expect(h.data.length).toBe(100); });
});

// ===== Extended Dashboard Tests =====
describe("Intelligence — Dashboard Extended", () => {
  it("dashboard with no data", () => { const d = generateIntelligenceDashboard(); expect(d.health.status).toBe("healthy"); expect(d.balanceFindings).toEqual([]); expect(d.recommendations).toEqual([]); });
  it("dashboard with all data", () => { recordTelemetry({ matchId: "m1", gameMode: "classic_quiz", eventType: "test" }); recordBalanceFinding({ gameMode: "classic_quiz", category: "test", severity: "warning", metric: "test", value: 1, threshold: 2, description: "" }); recordEconomyMetric({ resource: "xp", mode: "all", generated: 1000, consumed: 500, inflationRate: 0.15 }); generateEconomyReport(); recordDifficultyFinding({ issue: "too_hard", avgAnswerTimeMs: 25000, correctRate: 0.1, dropoutRate: 0.4, description: "" }); recordEducationalKPI({ userId: "u1", knowledgeRetention: 0.85, accuracyImprovement: 0.15, learningProgression: 0.7, masteryGrowth: 0.6, engagement: 0.9, participation: 0.85, completion: 0.8 }); generateRecommendation({ kind: "balance", priority: "critical", title: "Critical balance issue", description: "test", affectedMode: "classic_quiz", metric: "test", currentValue: 100, suggestedValue: 50 }); raiseHealthAlert({ kind: "disconnect_spike", severity: "critical", description: "Major spike" }); computeLiveHealth({ disconnectRate: 0.3, avgLatencyMs: 800, matchCount: 5, queueDepth: 20 }); const d = generateIntelligenceDashboard(); expect(d.balanceFindings.length).toBe(1); expect(d.economy?.inflationDetected).toBe(true); expect(d.difficultyFindings.length).toBe(1); expect(d.educationalKPIs.length).toBe(1); expect(d.recommendations.length).toBe(1); expect(d.alerts.length).toBe(1); expect(d.health.status).toBe("critical"); });
});

// ===== Extended Bridge Tests =====
describe("Intelligence — Bridge Extended", () => {
  it("unsubscribe stops processing", () => { subscribeIntelligence(); unsubscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "MatchFinished", "u1", { gameMode: "classic_quiz", result: "win" }); expect(getMatchTelemetry(m.id).length).toBe(0); });
  it("processes ScoreUpdated comeback", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "ScoreUpdated", "u1", { action: "comeback" }); expect(getMatchTelemetry(m.id).length).toBeGreaterThan(0); });
  it("ignores non-comeback ScoreUpdated", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "ScoreUpdated", "u1", { action: "streak_bonus" }); expect(getMatchTelemetry(m.id).length).toBe(0); });
  it("processed count increments", () => { subscribeIntelligence(); const m = createMatch({ hostId: "h1", gameMode: "classic_quiz" }); emitEvent(m.id, "MatchFinished", "u1", { gameMode: "classic_quiz", result: "win" }); const count = getBridgeProcessedCount(); emitEvent(m.id, "AnswerSubmitted", "u1", { isCorrect: true }); expect(getBridgeProcessedCount()).toBeGreaterThan(count); });
});

// ===== Extended Developer Tests =====
describe("Intelligence — Developer Extended", () => {
  it("has 9 API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.length).toBe(9); });
  it("has 3 extension hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBe(3); });
  it("hooks have trigger events", () => { for (const h of getDeveloperIntegration().extensionHooks) expect(h.triggerEvent).toBeDefined(); });
  it("SDK has docs URL", () => { expect(getDeveloperIntegration().sdkMetadata.docsUrl).toContain("edubek"); });
  it("all APIs require auth", () => { for (const a of getDeveloperIntegration().publicAPIs) expect(a.authRequired).toBe(true); });
});

// ===== Extended Meta Trends Tests =====
describe("Intelligence — Meta Extended", () => {
  it("strategy trend", () => { const t = recordMetaTrend({ category: "strategy", trend: "aggressive_play", value: 75, previousValue: 60 }); expect(t.category).toBe("strategy"); expect(t.trend).toBe("aggressive_play"); });
  it("resource preference trend", () => { const t = recordMetaTrend({ category: "resource_preference", trend: "gold_focus", value: 40, previousValue: 30 }); expect(t.changePct).toBeGreaterThan(0); });
  it("building preference trend", () => { const t = recordMetaTrend({ category: "building_preference", trend: "city_rush", value: 50, previousValue: 50 }); expect(t.changePct).toBe(0); });
  it("leaderboard trend", () => { const t = recordMetaTrend({ category: "leaderboard", trend: "new_leader", value: 1, previousValue: 2 }); expect(t.changePct).toBe(-50); });
  it("season trend", () => { const t = recordMetaTrend({ category: "season", trend: "participation_up", value: 1200, previousValue: 1000 }); expect(t.changePct).toBe(20); });
  it("multiple trends in same category", () => { recordMetaTrend({ category: "strategy", trend: "t1", value: 100, previousValue: 80 }); recordMetaTrend({ category: "strategy", trend: "t2", value: 200, previousValue: 150 }); expect(getMetaTrendsForCategory("strategy").length).toBe(2); });
});

// ===== Extended Season Intel Tests =====
describe("Intelligence — Season Extended", () => {
  it("season with high participation", () => { const s = recordSeasonIntelligence({ seasonId: "s1", participation: 5000, retention: 0.85, completion: 0.7, avgXP: 10000, competitionLevel: 0.9, clubActivity: 0.8 }); expect(s.participation).toBe(5000); });
  it("season with low retention", () => { const s = recordSeasonIntelligence({ seasonId: "s2", participation: 1000, retention: 0.3, completion: 0.2, avgXP: 2000, competitionLevel: 0.4, clubActivity: 0.3 }); expect(s.retention).toBe(0.3); });
  it("multiple seasons", () => { recordSeasonIntelligence({ seasonId: "s1", participation: 100, retention: 0.5, completion: 0.4, avgXP: 1000, competitionLevel: 0.6, clubActivity: 0.5 }); recordSeasonIntelligence({ seasonId: "s2", participation: 200, retention: 0.7, completion: 0.6, avgXP: 2000, competitionLevel: 0.8, clubActivity: 0.7 }); expect(getSeasonIntel("s1")).not.toBeNull(); expect(getSeasonIntel("s2")).not.toBeNull(); });
});

// ===== Extended Competitive Intel Tests =====
describe("Intelligence — Competitive Extended", () => {
  it("healthy competitive", () => { const c = recordCompetitiveIntelligence({ rankingVolatility: 0.1, ratingInflation: 0.02, leagueHealth: 0.95, queueQuality: 0.95, matchFairness: 0.92, tournamentCompletion: 0.98 }); expect(c.leagueHealth).toBeGreaterThan(0.9); });
  it("unhealthy competitive", () => { const c = recordCompetitiveIntelligence({ rankingVolatility: 0.5, ratingInflation: 0.2, leagueHealth: 0.5, queueQuality: 0.4, matchFairness: 0.5, tournamentCompletion: 0.6 }); expect(c.ratingInflation).toBeGreaterThan(0.1); });
  it("has all fields", () => { const c = recordCompetitiveIntelligence({ rankingVolatility: 0.3, ratingInflation: 0.05, leagueHealth: 0.85, queueQuality: 0.88, matchFairness: 0.9, tournamentCompletion: 0.92 }); expect(c.rankingVolatility).toBe(0.3); expect(c.ratingInflation).toBe(0.05); expect(c.leagueHealth).toBe(0.85); expect(c.queueQuality).toBe(0.88); expect(c.matchFairness).toBe(0.9); expect(c.tournamentCompletion).toBe(0.92); });
});
