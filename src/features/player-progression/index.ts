/** Player Progression Platform barrel export. Phase 6G.7. */
export * from "./service";

// Event Bus Bridge — the SOLE integration point between the engine Event Bus
// and the Player Progression Platform. See event-bus-bridge.ts for the
// architecture documentation and ownership boundaries.
export {
  subscribePlayerProgression,
  unsubscribePlayerProgression,
  isPlayerProgressionSubscribed,
  getProcessedEventCount as getProgressionProcessedEventCount,
  _resetBridgeForTesting as _resetProgressionBridgeForTesting,
} from "./event-bus-bridge";

export type {
  // System 1
  PlayerProfile, PlayerCareer, PlayerPreferences, MilestoneProgress, GameModeId,
  // System 2
  XPSourceKind, XPSourceConfig, XPEarnEvent, XPConfig,
  // System 3
  LevelCurveType, LevelCurveConfig, LevelInfo, LevelUpEvent, LevelUpReward,
  // System 4
  PrestigeConfig, PrestigeInfo, PrestigeHistoryEntry,
  // System 5
  AchievementDefinition, AchievementCategory, AchievementRarity, AchievementCondition, PlayerAchievement,
  // System 6
  BadgeDefinition, BadgeSource, PlayerBadge,
  // System 7
  TitleDefinition, PlayerTitle,
  // System 8
  AvatarCustomization, CosmeticItem,
  // System 9
  CareerStatistics, CareerStatsLifetime, CareerStatsPerMode, CareerStatsPerSeason, CareerStatsPerOrg, CareerStatsPerClassroom, CareerStatsPerTournament,
  // System 10
  MatchHistoryEntry,
  // System 11
  Season, SeasonReward, PlayerSeasonProgress, SeasonHistoryEntry, SeasonStatus,
  // System 12
  MissionDefinition, MissionFrequency, PlayerMission,
  // System 13
  ChallengeDefinition, ChallengeScope, PlayerChallenge,
  // System 14
  MonthlyChallengeDefinition,
  // System 15
  EventChallenge, EventKind,
  // System 16
  ProgressDashboard,
  // System 17
  RewardKind, RewardSpec, GrantedReward,
  // System 18
  MilestoneDefinition,
  // System 19
  ProgressAnalytics, XPGrowthData, RetentionData, AchievementCompletionData, MissionCompletionData, ProgressVelocityData, ModePreferenceData,
  // System 20
  CareerEventType, CareerTimelineEntry,
  // System 21
  ProfileExport,
  // System 22
  DashboardAudience, ProgressionDashboard, ProgressionMetrics, ProgressionAlert,
} from "./types";
