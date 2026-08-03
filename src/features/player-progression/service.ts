/** Player Progression service — composes all 22 systems. */
export {
  // System 1 — Player Profile
  createProfile, getProfile, updatePreferences, setAvatar, setBanner,
  // System 2 — XP Engine
  getXPConfig, setXPConfig, getSourceConfig, setSourceConfig, awardXP, getXPEvents, getTotalXP, getSeasonXP,
  DEFAULT_XP_CONFIG,
  // System 3 — Level Engine
  getLevelCurve, setLevelCurve, xpRequiredForLevel, computeLevel, getLevelInfo, getLevelUpEvents,
  DEFAULT_LEVEL_CURVE,
  // System 4 — Prestige
  getPrestigeConfig, setPrestigeConfig, getPrestigeInfo, prestige,
  DEFAULT_PRESTIGE_CONFIG,
  // System 9 — Career Statistics
  getCareerStatistics, recordMatchResult, getMatchHistory,
  // System 11 — Seasonal Progression
  createSeason, getSeason, listSeasons, getActiveSeason, enrollInSeason, getSeasonProgress, endSeason,
  // System 17 — Reward Engine
  grantReward, getGrantedRewards, grantRewards,
  // System 18 — Milestone Engine
  getMilestones, getMilestoneProgress, updateMilestones, MILESTONES,
} from "./progression-engine";

export {
  // System 5 — Achievement Platform
  ACHIEVEMENT_CATALOG, initializeAchievements, getAchievement, listAchievements, getPlayerAchievements, checkAchievementConditions,
  // System 6 — Badge Engine
  BADGE_CATALOG, initializeBadges, getBadge, listBadges, getPlayerBadges, awardBadge,
  // System 7 — Player Titles
  TITLE_CATALOG, initializeTitles, getTitle, listTitles, getPlayerTitles, awardTitle, equipTitle,
  // System 8 — Avatar & Identity
  COSMETIC_CATALOG, initializeCosmetics, getCosmetic, listCosmetics, getAvatarCustomization, unlockCosmetic, equipCosmetic,
  // System 12 — Daily Missions
  MISSION_CATALOG, initializeMissions, getMission, listMissions, getPlayerMissions, assignMission, updateMissionProgress, claimMissionReward,
  // System 13 — Weekly Challenges
  CHALLENGE_CATALOG, initializeChallenges, getChallenge, listChallenges, getPlayerChallenges, enrollInChallenge, updateChallengeProgress,
  // System 14 — Monthly Challenges
  listMonthlyChallenges,
  // System 15 — Event Challenges
  createEventChallenge, getEventChallenge, listEventChallenges,
} from "./achievement-profile";

export {
  // System 16 — Progress Dashboard
  generateProgressDashboard,
  // System 19 — Progress Analytics
  generateProgressAnalytics,
  // System 20 — Career Timeline
  getCareerTimeline, recordLevelUpTimeline, recordAchievementTimeline, recordTournamentWinTimeline,
  recordBadgeTimeline, recordTitleTimeline, recordMilestoneTimeline, recordPrestigeTimeline,
  recordChampionTimeline, recordSeasonFinishTimeline, recordTeacherAwardTimeline,
  // System 21 — Import / Export
  exportProfile, exportProfileJSON, exportProfileCSV,
  // System 22 — Progression Dashboard
  generateProgressionDashboard,
} from "./dashboard-analytics";
