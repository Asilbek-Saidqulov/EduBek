/**
 * EduBek — Treasure Heist Production Edition types.
 * Phase 6G.3: Strategic risk economy game mode built on top of the
 * Universal Game Engine (Phase 6G.1). Pure configuration/rules layer —
 * zero engine duplication. Players answer questions to earn gold, then
 * make strategic decisions: SAVE, INVEST, or STEAL.
 */

// ===========================================================================
// System 1 — Treasure Rules
// ===========================================================================
export interface TreasureHeistRules {
  gameMode: "treasure_heist";
  minPlayers: number; maxPlayers: number;
  allowSpectators: boolean; allowLateJoin: boolean;
  reconnectPolicy: "allow" | "deny" | "limited";
  roundCount: number; questionsPerRound: number;
  timePerQuestionMs: number;
  startingGold: number; questionReward: number;
  investSuccessProbability: number; stealSuccessProbability: number;
  stealAmount: number; stealPenalty: number;
  investMultiplier: number;
  decisionTimeoutMs: number;
  protectionShieldDurationMs: number;
  protectionCooldownMs: number; maxStealsPerMatch: number;
  minimumBalanceProtection: number; newPlayerProtectionRounds: number;
  hostControls: string[]; organizationRestricted: boolean;
  tieBreaker: "most_gold" | "most_correct" | "fastest";
}

// ===========================================================================
// System 2 — Gold Economy
// ===========================================================================
export type EconomyAction = "earn" | "spend" | "transfer" | "steal" | "bonus" | "penalty" | "recovery" | "invest_win" | "invest_loss";

export interface EconomyTransaction {
  id: string; matchId: string; userId: string;
  action: EconomyAction; amount: number; balance: number;
  targetUserId: string | null; reason: string; timestamp: string;
}

// ===========================================================================
// System 3 — Risk Decision Engine
// ===========================================================================
export type RiskDecision = "save" | "invest" | "steal";

export interface DecisionResult {
  decision: RiskDecision; success: boolean;
  amount: number; newBalance: number;
  targetUserId: string | null; message: string;
}

export interface DecisionWindow {
  matchId: string; userId: string; questionIndex: number;
  reward: number; openedAt: string; closesAt: string;
  decided: boolean; decision: RiskDecision | null;
}

// ===========================================================================
// System 4 — Protection System
// ===========================================================================
export interface ProtectionState {
  userId: string; shieldActive: boolean; shieldExpiresAt: string | null;
  stealsRemaining: number; cooldownUntil: string | null;
  lastStealAt: string | null; protectedByTeacher: boolean;
}

// ===========================================================================
// System 5 — Random Events
// ===========================================================================
export type RandomEventKind =
  | "golden_chest" | "treasure_map" | "lucky_coin" | "bandits"
  | "storm" | "trap" | "secret_vault" | "tax_collector" | "merchant" | "treasure_hunter";

export interface RandomEvent {
  id: string; kind: RandomEventKind; name: string; description: string;
  conditions: Record<string, unknown>; effects: Record<string, unknown>;
  durationMs: number; visibility: "public" | "private" | "hidden";
  priority: number; active: boolean;
}

export interface RandomEventInstance {
  event: RandomEvent; targetUserId: string | null;
  triggeredAt: string; expiresAt: string | null;
}

// ===========================================================================
// System 6 — Gameplay Flow
// ===========================================================================
export type GameplayPhase =
  | "question" | "answer" | "validation" | "reward"
  | "decision_window" | "resource_update" | "leaderboard" | "statistics" | "next_question";

// ===========================================================================
// System 7 — Leaderboards
// ===========================================================================
export type TreasureLeaderboardType =
  | "gold" | "net_worth" | "steals" | "successful_investments"
  | "accuracy" | "speed" | "correct_answers" | "efficiency" | "teacher_view" | "final_ranking";

export interface TreasureLeaderboardEntry {
  rank: number; userId: string; displayName: string;
  gold: number; netWorth: number; steals: number;
  successfulInvestments: number; accuracy: number;
  avgSpeedMs: number; correctAnswers: number; efficiency: number;
}

// ===========================================================================
// System 8 — Achievements
// ===========================================================================
export interface TreasureAchievement {
  id: string; name: string; description: string;
  condition: (stats: TreasureAchievementStats) => boolean;
  xpReward: number;
}

export interface TreasureAchievementStats {
  correctCount: number; totalAnswered: number;
  goldEarned: number; goldLost: number; currentGold: number;
  stealsAttempted: number; stealsSuccessful: number;
  investmentsAttempted: number; investmentsSuccessful: number;
  rank: number; perfectRound: boolean; maxGold: number;
}

// ===========================================================================
// System 9 — Match Summary
// ===========================================================================
export interface TreasureMatchSummary {
  matchId: string; winner: TreasureLeaderboardEntry | null;
  topPlayers: TreasureLeaderboardEntry[];
  economyTimeline: Array<{ timestamp: string; totalGold: number; avgGold: number }>;
  investmentStats: { attempted: number; successful: number; successRate: number; totalGained: number; totalLost: number };
  stealStats: { attempted: number; successful: number; successRate: number; totalStolen: number; totalPenalty: number };
  decisionDistribution: { save: number; invest: number; steal: number };
  averageAccuracy: number; fastestThinker: TreasureLeaderboardEntry | null;
  achievements: Array<{ userId: string; achievements: string[] }>;
  replayAvailable: boolean; exportAvailable: boolean;
  teacherReport: { interventions: number; eventsInjected: number; economyResets: number };
}

// ===========================================================================
// System 10 — Teacher Controls
// ===========================================================================
export type TreasureTeacherAction =
  | "pause" | "resume" | "skip" | "freeze_decisions" | "enable_events" | "disable_events"
  | "inject_event" | "protect_player" | "give_bonus" | "deduct_gold"
  | "reset_economy" | "reveal_economy" | "hide_economy" | "end_match" | "emergency_stop";

export interface TreasureTeacherControlResult {
  action: TreasureTeacherAction; success: boolean;
  audited: boolean; eventId: string | null; message: string;
}

// ===========================================================================
// System 11 — Student UX
// ===========================================================================
export type TreasureStudentUXState =
  | "waiting" | "question" | "answering" | "correct" | "wrong"
  | "decision" | "saving" | "investing" | "stealing" | "event"
  | "leaderboard" | "summary" | "disconnected" | "reconnecting";

// ===========================================================================
// System 12 — Analytics
// ===========================================================================
export interface TreasureAnalytics {
  matchId: string;
  economy: { avgGold: number; totalGold: number; goldInflation: number; maxGold: number; minGold: number };
  decisions: { saveCount: number; investCount: number; stealCount: number; savePercent: number; investPercent: number; stealPercent: number };
  risk: { avgRiskAppetite: number; stealSuccessRate: number; investSuccessRate: number };
  questionPerformance: { avgAccuracy: number; avgTimeMs: number; correctPercent: number; wrongPercent: number };
  teacherInterventions: number; dropouts: number; reconnects: number;
  replayUsage: number; completionRate: number;
}

// ===========================================================================
// System 13 — Accessibility
// ===========================================================================
export interface TreasureAccessibilityConfig {
  keyboardNavigation: boolean; reducedMotion: boolean; highContrast: boolean;
  screenReader: boolean; largeText: boolean; colorBlindFriendly: boolean;
  audioCues: boolean; timerAccessibility: boolean;
}

// ===========================================================================
// System 14 — Live Dashboard
// ===========================================================================
export interface TreasureDashboard {
  matchId: string;
  economyGraph: Array<{ timestamp: string; totalGold: number }>;
  currentLeaders: TreasureLeaderboardEntry[];
  decisionTimer: { remaining: number; total: number; active: boolean };
  pendingDecisions: number;
  activeEvents: RandomEventInstance[];
  recentSteals: EconomyTransaction[];
  recentInvestments: EconomyTransaction[];
  interventions: number;
  matchHealth: "healthy" | "warning" | "critical";
  avgLatencyMs: number;
  playerStatus: { connected: number; disconnected: number; total: number };
}
