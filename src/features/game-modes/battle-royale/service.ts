/** Battle Royale service — composes all 20 systems. Reuses Game Engine. */
export {
  // Tournament Engine
  BATTLE_ROYALE_RULES, getRules, createTournament, getTournament, listTournaments,
  destroyTournament, registerPlayer, unregisterPlayer, setSeedingStrategy,
  // Bracket Engine
  generateBracket, getBracket, getMatchById, getMatchesByRound,
  // Seeding Engine
  seedPlayers,
  // Duel Engine
  getDuelConfig, startDuel, recordDuelResult, getDuel, listDuels,
  // Advancement Engine
  advanceWinner, getAdvancementEvents,
  // Bye Engine
  assignBye, advanceBye, getByes,
  // Walkover Engine
  recordWalkover, getWalkovers,
  // Tie Resolution Engine
  resolveTie, getTieResolutions,
  // Championship Engine
  crownChampion, recordBronze, completeTournament, getChampionship,
} from "./tournament-engine";

export {
  // Leaderboards
  buildLeaderboard,
  // Achievements
  BATTLE_ROYALE_ACHIEVEMENTS, checkAchievements,
  // Tournament Flow
  getTournamentPhase, setTournamentPhase, startTournament,
  // Teacher Controls
  executeTeacherAction,
  // Student UX
  getStudentUXState,
  // Analytics
  generateAnalytics,
  // Replay Integration
  getReplayTimeline, getDuelReplay,
  // Spectator Experience
  addTournamentSpectator, getSpectatorView,
  // Accessibility
  BATTLE_ROYALE_ACCESSIBILITY,
  // Dashboard
  generateDashboard,
  // Competitive Balance
  COMPETITIVE_PRESETS, getBalancePresets, getPreset,
  // Anti-Cheat (reuses engine)
  checkBattleRoyaleCheat,
  // Status
  getBattleRoyaleStatus,
} from "./gameplay-dashboard";
