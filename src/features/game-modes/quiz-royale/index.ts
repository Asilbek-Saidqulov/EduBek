/** Quiz Royale barrel export. Phase 6G.5. */
export { ROYALE_RULES, getRules, BALANCE_PRESETS, initLives, getLifeState, getLives, loseLife, restoreLife, grantLife, revivePlayer, initShields, getShieldState, earnShield, consumeShield, grantShield, eliminatePlayer, checkTimeoutElimination, eliminateForWrongAnswer, eliminateForDisconnect, eliminateForAfk, eliminateForTeacherRemoved, eliminateForManualAction, eliminateForRuleViolation, eliminateForReconnectExpired, checkFinalSurvivor, initSurvivalState, getSurvivalState, recordElimination, recordShieldUsage, recordComeback, checkDangerState,
  runQuestionPhase, runAnswerPhase, runEliminationPhase, runLeaderboardPhase, runNextQuestionPhase, buildRoyaleLeaderboard, ROYALE_ACHIEVEMENTS, checkRoyaleAchievements, generateRoyaleMatchSummary, executeRoyaleTeacherAction, getRoyaleStudentUXState, generateRoyaleAnalytics, getDeathReasonBreakdown, ROYALE_ACCESSIBILITY, generateRoyaleDashboard, checkRoyaleCheats, getBalancePresets, getRoyaleReplayTimeline, getRoyaleStatus,
} from "./service";

export { DEATH_REASON_LABELS, deathReasonI18nKey } from "./types";

export type {
  RoyaleRules, LifeEvent, PlayerLifeState, PlayerShieldState, EliminationRecord, SurvivalState,
  RoyaleGameplayPhase, RoyaleLeaderboardType, RoyaleLeaderboardEntry, RoyaleAchievement, RoyaleAchievementStats,
  RoyaleMatchSummary, RoyaleAnalytics, RoyaleTeacherAction, RoyaleTeacherResult, RoyaleStudentUXState,
  RoyaleAccessibilityConfig, RoyaleDashboard, RoyaleCheatFinding, BalancePreset,
} from "./types";
