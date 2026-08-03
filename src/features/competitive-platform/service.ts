/** Competitive Platform service — composes all 24 systems. */
export {
  // Systems 1-6
  createCompetitiveProfile, getCompetitiveProfile, setPreferredModes,
  getRatingConfig, setRatingConfig, getRatingRecord, initRatingRecord, applyRatingUpdate, getRatingHistory,
  DEFAULT_RATING_CONFIG,
  getPlacementConfig, setPlacementConfig, startPlacement, recordPlacementMatch, getPlacementMatches,
  DEFAULT_PLACEMENT_CONFIG,
  createMatchmakingTicket, findMatch, widenSearch, cancelTicket, expireStaleTickets, getTicket,
  getQueueConfig, setQueueConfig, enqueue, dequeue, getQueueSize, leaveQueue, getAllQueueSizes,
  QUEUE_CONFIGS,
  getRankedConfig, setRankedConfig, isRankedAvailable, getMatchesForRewards, eligibleForSeasonRewards,
  DEFAULT_RANKED_CONFIG,
} from "./rating-matchmaking";

export {
  // Systems 7-15, 20-21
  DIVISIONS, getDivisionForRating, getDivision, listDivisions,
  createLeague, getLeague, listLeagues, updateLeagueStandings,
  createSeason, getSeason, listSeasons, getActiveSeason, endSeason, getSeasonHistory,
  PROMOTION_CONFIG, getPromotionState, startPromotionSeries, recordPromotionMatch, triggerDemotionWarning, applyDemotion,
  createTournament, getTournament, listTournaments, registerForTournament, startTournament, completeTournament, cancelTournament,
  createChampionship, getChampionship, listChampionships, completeChampionship,
  scheduleTournamentPhase, executeScheduledPhase, getSchedulerEvents,
  seedPlayers,
  createOrganizationCompetition, getOrganizationCompetition, listOrganizationCompetitions, completeOrganizationCompetition,
  createOlympiad, getOlympiad, listOlympiads, registerForOlympiad, completeOlympiad,
} from "./competition-tournaments";

export {
  // Systems 11, 16-19, 22-24
  buildLeaderboard, updateLeaderboardEntry, getLeaderboard,
  generateSpectatorDashboard,
  grantCompetitiveReward, getCompetitiveRewards,
  reportFairPlayFinding, getFairPlayFindings, reviewFairPlayFinding, autoDetectFairPlay,
  generateCompetitiveAnalytics,
  addHallOfFameEntry, getHallOfFame,
  generateCompetitiveDashboard,
  recordAdminAction, getAdminActions, submitAppeal, reviewAppeal, getAppeals,
} from "./leaderboards-analytics";
