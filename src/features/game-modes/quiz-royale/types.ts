/**
 * EduBek — Quiz Royale Production Edition types.
 * Phase 6G.5: Last Student Standing survival game mode on top of
 * Universal Game Engine. Pure configuration/rules layer.
 *
 * Architecture note — Resource categories:
 *   Quiz Royale registers "Lives" and "Shields" as SURVIVAL RESOURCES
 *   implemented through the engine's Resource Pipeline. They are conceptually
 *   distinct from Economy Resources (Gold, Wood, Stone, Food, Energy) used by
 *   Treasure Heist and Empire Builder, but flow through the same pipeline
 *   internally — no engine branching required.
 *
 * Architecture note — Death reasons:
 *   Every elimination records a structured DeathReason from the engine
 *   taxonomy (wrong_answer, timeout, disconnected, teacher_removed, afk,
 *   manual_elimination, rule_violation, reconnect_expired). This powers
 *   analytics, replay annotations, tournament disputes, anti-cheat
 *   differentiation, and moderation review.
 */
import type { DeathReason } from "@/features/game-engine";

// System 1 — Rules
export interface RoyaleRules {
  gameMode: "quiz_royale"; minPlayers: number; maxPlayers: number;
  allowSpectators: boolean; allowLateJoin: boolean; reconnectPolicy: "allow" | "deny" | "limited";
  roundCount: number; questionsPerRound: number; timePerQuestionMs: number;
  startingLives: number; maxLives: number;
  shieldMaxCount: number; shieldCooldownMs: number; shieldExpirationMs: number | null;
  revivalEnabled: boolean; revivalCost: number;
  eliminationThreshold: number; overtimeEnabled: boolean; overtimeMs: number;
  reconnectGraceMs: number; tieResolution: "sudden_death" | "most_lives" | "fastest";
  hostControls: string[]; organizationRestricted: boolean;
}

// System 2 — Lives
export interface LifeEvent { id: string; matchId: string; userId: string; action: "lose" | "restore" | "extra" | "grant" | "revive" | "death" | "elimination"; livesBefore: number; livesAfter: number; reason: string; timestamp: string; }
export interface PlayerLifeState { userId: string; matchId: string; lives: number; maxLives: number; isEliminated: boolean; eliminatedAt: string | null; /** Structured death reason — null until eliminated. */ deathReason: DeathReason | null; history: LifeEvent[]; }

// System 3 — Shields
export interface PlayerShieldState { userId: string; matchId: string; shields: number; maxShields: number; cooldownUntil: string | null; expirationAt: string | null; lastUsedAt: string | null; }

// System 4 — Elimination
export interface EliminationRecord {
  userId: string; matchId: string; eliminatedAt: string;
  /** Structured death reason from engine taxonomy. Powers analytics, replay,
   *  tournaments, anti-cheat, moderation. */
  deathReason: DeathReason;
  /** Free-text reason kept for backward compatibility + edge-case notes
   *  that don't fit the structured taxonomy. */
  reason: string;
  rank: number; livesRemaining: number;
}

/** Human-readable label metadata for each DeathReason. UI may override with
 *  i18n keys (`quizRoyale.deathReasons.<reason>`); this is the fallback. */
export const DEATH_REASON_LABELS: Record<DeathReason, string> = {
  wrong_answer: "Wrong Answer",
  timeout: "Timeout",
  disconnected: "Disconnected",
  teacher_removed: "Teacher Removed",
  afk: "AFK",
  manual_elimination: "Manual Elimination",
  rule_violation: "Rule Violation",
  reconnect_expired: "Reconnect Expired",
};

/** i18n key path for a DeathReason — e.g. "quizRoyale.deathReasons.timeout". */
export function deathReasonI18nKey(reason: DeathReason): string {
  return `quizRoyale.deathReasons.${reason}`;
}

// System 5 — Survival Progression
export interface SurvivalState { matchId: string; currentSurvivors: string[]; eliminatedPlayers: EliminationRecord[]; eliminationOrder: string[]; longestSurvivalMs: number; shieldUsageCount: number; comebackCount: number; dangerStates: Array<{ userId: string; enteredAt: string; resolvedAt: string | null }>; }

// System 6 — Gameplay Flow
export type RoyaleGameplayPhase = "question" | "answer" | "validation" | "life_update" | "shield_check" | "elimination" | "leaderboard" | "statistics" | "next_question" | "final_winner";

// System 7 — Leaderboards
export type RoyaleLeaderboardType = "survival_rank" | "elimination_order" | "remaining_lives" | "shields" | "score" | "accuracy" | "response_speed" | "longest_streak" | "teacher_dashboard" | "final_standings";
export interface RoyaleLeaderboardEntry { rank: number; userId: string; displayName: string; lives: number; shields: number; score: number; accuracy: number; avgSpeedMs: number; longestStreak: number; eliminated: boolean; eliminationRank: number | null; }

// System 8 — Achievements
export interface RoyaleAchievement { id: string; name: string; description: string; condition: (s: RoyaleAchievementStats) => boolean; xpReward: number; }
export interface RoyaleAchievementStats { won: boolean; livesRemaining: number; shieldsUsed: number; shieldsRemaining: number; correctCount: number; totalAnswered: number; longestStreak: number; rank: number; comebacks: number; mistakes: number; fastestMs: number; survivedMs: number; }

// System 9 — Match Summary
export interface RoyaleMatchSummary { matchId: string; champion: RoyaleLeaderboardEntry | null; eliminationTimeline: EliminationRecord[]; survivalGraph: Array<{ timestamp: string; survivors: number }>; shieldUsage: { total: number; successful: number; expired: number }; lifeHistory: { totalLivesLost: number; totalLivesGained: number; revives: number }; averageAccuracy: number; replayAvailable: boolean; teacherReport: { interventions: number; revives: number; pauses: number }; achievements: Array<{ userId: string; achievements: string[] }>; }

// System 10 — Teacher Controls
export type RoyaleTeacherAction = "pause" | "resume" | "freeze" | "revive_player" | "grant_life" | "remove_life" | "grant_shield" | "remove_shield" | "skip" | "reveal" | "hide" | "emergency_stop" | "end_match";
export interface RoyaleTeacherResult { action: RoyaleTeacherAction; success: boolean; audited: boolean; eventId: string | null; message: string; }

// System 11 — Student UX
export type RoyaleStudentUXState = "lobby" | "ready" | "question" | "waiting" | "shield_active" | "danger" | "eliminated" | "spectating" | "winner" | "disconnected" | "reconnecting" | "paused" | "summary" | "loading" | "finished";

// System 13 — Analytics
export interface RoyaleAnalytics { matchId: string; eliminationDistribution: Record<string, number>; mistakes: number; shieldsUsed: number; shieldSuccessRate: number; comebackRate: number; disconnects: number; reconnects: number; avgSurvivalMs: number; longestSurvivalMs: number; dropouts: number; completionRate: number; }

// System 14 — Accessibility
export interface RoyaleAccessibilityConfig { colorBlind: boolean; reducedMotion: boolean; screenReader: boolean; largeUI: boolean; keyboard: boolean; captions: boolean; timerWarnings: boolean; highContrast: boolean; }

// System 15 — Dashboard
export interface RoyaleDashboard { matchId: string; survivors: number; eliminated: number; totalShields: number; totalLives: number; leaderboard: RoyaleLeaderboardEntry[]; interventions: number; avgLatencyMs: number; reconnects: number; matchHealth: "healthy" | "warning" | "critical"; dangerPlayers: string[]; }

// System 16 — Anti-Cheat
export interface RoyaleCheatFinding { id: string; matchId: string; userId: string; kind: string; severity: "low" | "medium" | "high" | "critical"; description: string; evidence: string; }

// System 17 — Balance Configuration
export interface BalancePreset { name: string; rules: Partial<RoyaleRules>; }
