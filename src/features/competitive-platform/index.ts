/** Competitive Platform barrel export. Phase 6G.8. */
export * from "./service";

// Event Bus Bridge — the SOLE integration point between the engine Event Bus
// and the Competitive Platform. See event-bus-bridge.ts for the architecture
// documentation and ownership boundaries.
export {
  subscribeCompetitivePlatform,
  unsubscribeCompetitivePlatform,
  isCompetitivePlatformSubscribed,
  getProcessedEventCount as getCompetitiveProcessedEventCount,
  _resetBridgeForTesting as _resetCompetitiveBridgeForTesting,
} from "./event-bus-bridge";

export type {
  // System 1
  GameModeId, CompetitiveProfile, PlacementStatus,
  // System 2
  RatingAlgorithm, RatingConfig, RatingRecord, RatingChange,
  // System 3
  PlacementKind, PlacementConfig, PlacementMatch,
  // System 4
  MatchmakingCriteria, MatchmakingTicket, MatchmakingResult,
  // System 5
  QueueType, QueueConfig, QueueEntry,
  // System 6
  RankedMode, RankedConfig,
  // System 7
  DivisionTier, DivisionDefinition,
  // System 8
  League, LeagueType, LeagueStanding,
  // System 9
  CompetitiveSeason, SeasonReward, SeasonHistory, SeasonStatus,
  // System 10
  PromotionState, PromotionStatus, PromotionEvent,
  // System 11
  LeaderboardView, LeaderboardEntry, Leaderboard,
  // System 12
  TournamentFormat, TournamentStatus, CompetitiveTournament,
  // System 13
  Championship, ChampionshipLevel,
  // System 14
  SchedulerEvent, SchedulerPhase,
  // System 15
  SeedingStrategy, SeedingInput, SeedingResult,
  // System 16
  SpectatorDashboard, LiveStatistics,
  // System 17
  CompetitiveRewardKind, CompetitiveReward,
  // System 18
  FairPlayViolationKind, FairPlaySeverity, FairPlayFinding,
  // System 19
  CompetitiveAnalytics,
  // System 20
  OrganizationCompetition, OrganizationCompetitionType,
  // System 21
  Olympiad, OlympiadKind,
  // System 22
  HallOfFameCategory, HallOfFameEntry,
  // System 23
  CompetitiveDashboard, CompetitiveAlert,
  // System 24
  AdminAction, AdminActionRecord, AppealRecord,
} from "./types";
