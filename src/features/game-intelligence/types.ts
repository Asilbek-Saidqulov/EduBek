/**
 * EduBek — Game Intelligence, Balance, Telemetry & Live Analytics Platform types.
 * Phase 6G.13: Passive analytical platform that produces deterministic analytics,
 * balance insights, telemetry, simulations, anomaly detection, and recommendations.
 *
 * Architecture: Passive Event Bus consumer. Read-only analytical platform.
 * Never owns gameplay, never modifies game rules, never executes automatic balancing.
 * Recommendations are advisory only.
 */

// System 1 — Gameplay Telemetry
export interface TelemetryEvent {
  id: string; matchId: string; userId: string | null; gameMode: string;
  eventType: string; timestamp: string; durationMs: number | null;
  value: number | null; metadata: Record<string, unknown>;
}
export interface TelemetrySummary {
  matchId: string; totalEvents: number; questionDurations: number[];
  answerDistributions: Record<string, number>; avgLatencyMs: number;
  reconnects: number; disconnects: number; timerExtensions: number;
  pauses: number; skips: number; overtime: number; hostInterventions: number;
}

// System 2 — Balance Intelligence
export type GameModeId = "classic_quiz" | "treasure_heist" | "empire_builder" | "quiz_royale" | "battle_royale";
export interface BalanceFinding {
  id: string; gameMode: GameModeId; category: string; severity: "info" | "warning" | "critical";
  metric: string; value: number; threshold: number; description: string; timestamp: string;
}
export interface BalanceReport {
  gameMode: GameModeId; findings: BalanceFinding[];
  avgScore: number; accuracyRate: number; completionRate: number; dropoffRate: number;
  updatedAt: string;
}

// System 3 — Economy Intelligence
export interface EconomyMetric {
  id: string; resource: string; mode: string; generated: number; consumed: number;
  netFlow: number; inflationRate: number; timestamp: string;
}
export interface EconomyReport {
  xpEconomy: EconomyMetric | null; goldEconomy: EconomyMetric | null;
  resourceEconomy: EconomyMetric | null; cosmeticUnlockRate: number;
  inflationDetected: boolean; updatedAt: string;
}

// System 4 — Difficulty Intelligence
export type DifficultyIssue = "too_easy" | "too_hard" | "dropoff" | "rage_quit" | "confusing" | "time_pressure" | "teacher_override";
export interface DifficultyFinding {
  id: string; questionId: string | null; issue: DifficultyIssue;
  avgAnswerTimeMs: number; correctRate: number; dropoutRate: number;
  description: string; timestamp: string;
}

// System 5 — Educational Intelligence
export interface EducationalKPI {
  userId: string; knowledgeRetention: number; accuracyImprovement: number;
  learningProgression: number; masteryGrowth: number; engagement: number;
  participation: number; completion: number;
}

// System 6 — Meta Analytics
export interface MetaTrend {
  id: string; category: string; trend: string; value: number;
  previousValue: number; changePct: number; timestamp: string;
}

// System 7 — Player Segmentation
export type PlayerSegment = "beginner" | "casual" | "competitive" | "expert" | "speed_player" | "accurate_player" | "risk_taker" | "builder" | "survivor";
export interface PlayerSegmentation {
  userId: string; segments: PlayerSegment[]; assignedAt: string;
  metrics: { matchesPlayed: number; avgAccuracy: number; avgSpeedMs: number; winRate: number; };
}

// System 8 — Match Intelligence
export interface MatchIntelligence {
  matchId: string; quality: number; dropouts: number; networkStability: number;
  teacherInterventions: number; fairness: number; completion: number; engagement: number;
}

// System 9 — Live Health Monitoring
export type HealthAlertKind = "disconnect_spike" | "latency_spike" | "long_match" | "queue_congestion" | "event_storm" | "resource_anomaly";
export interface HealthAlert {
  id: string; kind: HealthAlertKind; severity: "info" | "warning" | "critical";
  description: string; detectedAt: string; resolvedAt: string | null;
}
export interface LiveHealth {
  status: "healthy" | "degraded" | "critical"; activeAlerts: HealthAlert[];
  disconnectRate: number; avgLatencyMs: number; matchCount: number; queueDepth: number;
  updatedAt: string;
}

// System 10 — Simulation Engine
export interface SimulationConfig {
  id: string; name: string; description: string; gameMode: GameModeId;
  changes: Record<string, unknown>; status: "draft" | "running" | "completed" | "failed";
  result: SimulationResult | null; createdAt: string;
}
export interface SimulationResult {
  projectedAvgScore: number; projectedCompletionRate: number; projectedDropoffRate: number;
  projectedDurationMs: number; confidenceScore: number; notes: string;
}

// System 11 — A/B Configuration Analyzer
export interface ABComparison {
  id: string; configA: Record<string, unknown>; configB: Record<string, unknown>;
  metricA: number; metricB: number; difference: number; winner: "A" | "B" | "tie";
  confidence: number; timestamp: string;
}

// System 12 — Recommendation Engine
export type RecommendationKind = "balance" | "economy" | "difficulty" | "timer" | "reward" | "config" | "educational";
export type RecommendationPriority = "low" | "medium" | "high" | "critical";
export interface Recommendation {
  id: string; kind: RecommendationKind; priority: RecommendationPriority;
  title: string; description: string; affectedMode: GameModeId | "all";
  metric: string; currentValue: number; suggestedValue: number | null;
  autoApplied: false; timestamp: string;
}

// System 13 — Heatmap Engine
export type HeatmapType = "question_timeline" | "player_activity" | "dropout_timeline" | "economy_flow" | "resource_flow";
export interface Heatmap {
  id: string; type: HeatmapType; matchId: string | null;
  data: Array<{ x: number; y: number; intensity: number }>; generatedAt: string;
}

// System 14 — Season Intelligence
export interface SeasonIntelligence {
  seasonId: string; participation: number; retention: number; completion: number;
  avgXP: number; competitionLevel: number; clubActivity: number; updatedAt: string;
}

// System 15 — Competitive Intelligence
export interface CompetitiveIntelligence {
  rankingVolatility: number; ratingInflation: number; leagueHealth: number;
  queueQuality: number; matchFairness: number; tournamentCompletion: number; updatedAt: string;
}

// System 16 — Dashboard Platform
export interface IntelligenceDashboard {
  health: LiveHealth; balanceFindings: BalanceFinding[]; economy: EconomyReport | null;
  difficultyFindings: DifficultyFinding[]; educationalKPIs: EducationalKPI[];
  recommendations: Recommendation[]; alerts: HealthAlert[]; updatedAt: string;
}

// System 18 — Developer Integration
export interface IntelligenceDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string };
}

// System 17 — Event Bus Bridge
export type IntelligenceEventType = "TelemetryRecorded" | "BalanceFindingDetected" | "AnomalyDetected" | "RecommendationGenerated";
