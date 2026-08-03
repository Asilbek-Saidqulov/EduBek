/** Treasure Heist barrel export. Phase 6G.3. */
export { TREASURE_HEIST_RULES, getRules, validateRules, initEconomy, executeEconomyAction, getGoldBalance, recordTransaction, getTransactionHistory, executeDecision, openDecisionWindow, closeDecisionWindow, getProtection, activateShield, checkShieldExpiry, consumeSteal, teacherProtect, getEventDefinitions, triggerEvent, getActiveEvents, cleanupExpiredEvents,
  runQuestionPhase, runAnswerPhase, runRewardPhase, runDecisionPhase, runLeaderboardPhase, runStatisticsPhase, runNextQuestionPhase, buildTreasureLeaderboard, TREASURE_ACHIEVEMENTS, checkTreasureAchievements, generateTreasureMatchSummary,
  executeTreasureTeacherAction, getTreasureStudentUXState, generateTreasureAnalytics, TREASURE_ACCESSIBILITY, getTreasureAccessibility, generateTreasureDashboard, getTreasureHeistStatus,
} from "./service";

export type {
  TreasureHeistRules, EconomyAction, EconomyTransaction,
  RiskDecision, DecisionResult, DecisionWindow,
  ProtectionState, RandomEventKind, RandomEvent, RandomEventInstance,
  GameplayPhase, TreasureLeaderboardType, TreasureLeaderboardEntry,
  TreasureAchievement, TreasureAchievementStats, TreasureMatchSummary,
  TreasureTeacherAction, TreasureTeacherControlResult,
  TreasureStudentUXState, TreasureAnalytics, TreasureAccessibilityConfig, TreasureDashboard,
} from "./types";
