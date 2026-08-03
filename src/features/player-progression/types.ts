/**
 * EduBek — Cross-Mode Player Progression Platform types.
 * Phase 6G.7: Unified player identity, XP, levels, achievements, badges,
 * titles, seasons, missions, challenges, and career timeline across all
 * 5 game modes (Classic Quiz, Treasure Heist, Empire Builder, Quiz Royale,
 * Battle Royale).
 *
 * Architecture (event-driven, fully decoupled):
 *
 *                    Universal Game Engine
 *                             │
 *                      Engine Event Bus
 *                             │
 *       ┌──────────────┬──────────────┬──────────────┬──────────────┐
 *       │              │              │              │
 *       ▼              ▼              ▼              ▼
 *  Player          Competitive    Analytics     Hall of Fame
 *  Progression     Platform
 *       │
 *       ▼
 *  Player Profile
 *
 *   This platform is the SINGLE SOURCE OF TRUTH for long-term player
 *   progression. Game modes do NOT own XP. They emit engine events; this
 *   platform subscribes to those events (via event-bus-bridge.ts) and
 *   updates progression autonomously.
 *
 *   No gameplay mechanics live here.
 *   No scoring formulas live here.
 *   All progression is event-driven and deterministic.
 *
 * Ownership boundaries (strict):
 *   - Player Progression owns: XP, levels, achievements, badges, titles,
 *     milestones, career stats, seasons (progression-side), missions, rewards.
 *   - Player Progression NEVER owns: rating, division, league, matchmaking,
 *     tournaments (competitive-side), fair play.
 *   - Player Progression NEVER imports from competitive-platform.
 *   - Player Progression NEVER calls any competitive API.
 *
 * Strict rules:
 *   - Universal Game Engine untouched
 *   - All 5 game modes unchanged
 *   - Analytics, Replay, Event Bus untouched
 *   - Consume engine events only (via event-bus-bridge.ts)
 *   - No direct service-to-service calls
 *   - No circular dependencies
 *
 * Storage:
 *   In-memory state for the platform's own aggregates (consistent with
 *   Battle Royale's in-memory tournament state pattern). The engine's
 *   existing Profile model (level + xp fields) remains the persistence
 *   layer; this platform caches + computes derived aggregates.
 */

// ===========================================================================
// System 1 — Unified Player Profile
// ===========================================================================

export type GameModeId = "classic_quiz" | "treasure_heist" | "empire_builder" | "quiz_royale" | "battle_royale";

export interface PlayerProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  frameId: string | null;
  borderId: string | null;
  titleId: string | null;
  prestigeLevel: number;
  level: number;
  totalXP: number;
  seasonXP: number;
  currentSeasonId: string | null;
  career: PlayerCareer;
  preferences: PlayerPreferences;
  milestones: MilestoneProgress[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerCareer {
  totalMatches: number;
  totalWins: number;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  totalTournamentsPlayed: number;
  totalTournamentsWon: number;
  totalPlaytimeMs: number;
  firstMatchAt: string | null;
  lastMatchAt: string | null;
}

export interface PlayerPreferences {
  preferredMode: GameModeId | null;
  privacyLevel: "public" | "friends" | "private";
  showInLeaderboards: boolean;
  notificationsEnabled: boolean;
  language: string;
}

export interface MilestoneProgress {
  milestoneId: string;
  currentValue: number;
  targetValue: number;
  achieved: boolean;
  achievedAt: string | null;
}

// ===========================================================================
// System 2 — Cross-Mode XP Engine
// ===========================================================================

export type XPSourceKind =
  | "question_correct"
  | "perfect_round"
  | "victory"
  | "participation"
  | "comeback"
  | "tournament_champion"
  | "achievement"
  | "daily_mission"
  | "weekly_mission"
  | "monthly_challenge"
  | "event_challenge"
  | "milestone"
  | "teacher_award"
  | "streak_bonus";

export interface XPSourceConfig {
  kind: XPSourceKind;
  baseAmount: number;
  /** Multiplier applied to baseAmount (1.0 = no change). */
  multiplier: number;
  /** Whether this source is enabled. */
  enabled: boolean;
  /** Optional daily cap for this source (0 = no cap). */
  dailyCap: number;
}

export interface XPEarnEvent {
  id: string;
  userId: string;
  source: XPSourceKind;
  amount: number;
  gameMode: GameModeId | null;
  matchId: string | null;
  seasonId: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface XPConfig {
  sources: XPSourceConfig[];
  /** Global multiplier applied to all XP gains (1.0 = no change). */
  globalMultiplier: number;
  /** Whether prestige multiplier applies. */
  prestigeMultiplierEnabled: boolean;
  /** Prestige multiplier per prestige level (e.g. 0.05 = +5% per prestige). */
  prestigeMultiplierPerLevel: number;
}

// ===========================================================================
// System 3 — Level Engine
// ===========================================================================

export type LevelCurveType = "linear" | "exponential" | "custom" | "seasonal";

export interface LevelCurveConfig {
  type: LevelCurveType;
  /** For linear: XP needed = baseXP + (level - 1) * stepXP. */
  baseXP: number;
  /** For linear: increment per level. */
  stepXP: number;
  /** For exponential: XP needed = baseXP * (growthRate ^ (level - 1)). */
  growthRate: number;
  /** For custom: explicit XP array per level. */
  customThresholds: number[];
  /** Maximum level (0 = unlimited). */
  maxLevel: number;
}

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPct: number;
  isMaxLevel: boolean;
}

export interface LevelUpEvent {
  id: string;
  userId: string;
  newLevel: number;
  previousLevel: number;
  timestamp: string;
  rewards: LevelUpReward[];
}

export interface LevelUpReward {
  kind: "badge" | "title" | "cosmetic" | "xp_bonus";
  rewardId: string;
  displayName: string;
}

// ===========================================================================
// System 4 — Prestige System
// ===========================================================================

export interface PrestigeConfig {
  /** Minimum level required to prestige. */
  minLevelToPrestige: number;
  /** XP multiplier granted per prestige level (e.g. 0.05 = +5%). */
  xpMultiplierPerPrestige: number;
  /** Whether prestige resets level + XP. */
  resetsProgress: boolean;
  /** Maximum prestige level (0 = unlimited). */
  maxPrestige: number;
}

export interface PrestigeInfo {
  userId: string;
  prestigeLevel: number;
  canPrestige: boolean;
  totalPrestiges: number;
  history: PrestigeHistoryEntry[];
  badges: string[];
  rewards: string[];
}

export interface PrestigeHistoryEntry {
  prestigeLevel: number;
  timestamp: string;
  levelAtPrestige: number;
  xpAtPrestige: number;
}

// ===========================================================================
// System 5 — Achievement Platform
// ===========================================================================

export type AchievementCategory =
  | "classic_quiz"
  | "treasure_heist"
  | "empire_builder"
  | "quiz_royale"
  | "battle_royale"
  | "cross_mode"
  | "social"
  | "competitive"
  | "seasonal"
  | "secret"
  | "teacher"
  | "career";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  badgeId: string | null;
  titleId: string | null;
  /** Optional game-mode-specific condition metadata. */
  condition: AchievementCondition;
  /** Whether this achievement is hidden until unlocked. */
  hidden: boolean;
  /** Required achievement IDs that must be unlocked first. */
  prerequisites: string[];
}

export interface AchievementCondition {
  /** Metric being tracked (e.g. "total_wins", "perfect_rounds"). */
  metric: string;
  /** Comparison operator. */
  operator: ">=" | ">" | "==" | "<=" | "<";
  /** Target value. */
  target: number;
  /** Optional game mode filter. */
  gameMode: GameModeId | null;
}

export interface PlayerAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string;
  progress: number;
  completed: boolean;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Badge Engine
// ===========================================================================

export type BadgeSource =
  | "achievement"
  | "season"
  | "competition"
  | "organization"
  | "special_event"
  | "teacher_award";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  source: BadgeSource;
  iconUrl: string | null;
  rarity: AchievementRarity;
  /** Whether this badge grants cosmetic rewards. */
  cosmeticRewardId: string | null;
}

export interface PlayerBadge {
  badgeId: string;
  userId: string;
  awardedAt: string;
  awardedBy: string | null;
  source: BadgeSource;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 7 — Player Titles
// ===========================================================================

export interface TitleDefinition {
  id: string;
  name: string;
  description: string;
  category: "career" | "competitive" | "social" | "seasonal" | "special";
  rarity: AchievementRarity;
  /** Requirement to unlock (textual description for display). */
  requirement: string;
  /** Whether this title is currently equippable. */
  equipable: boolean;
}

export interface PlayerTitle {
  titleId: string;
  userId: string;
  unlockedAt: string;
  equipped: boolean;
}

// ===========================================================================
// System 8 — Avatar & Identity
// ===========================================================================

export interface AvatarCustomization {
  userId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  frameId: string | null;
  borderId: string | null;
  colorScheme: string | null;
  unlockedFrames: string[];
  unlockedBorders: string[];
  unlockedBanners: string[];
}

export interface CosmeticItem {
  id: string;
  kind: "frame" | "border" | "banner" | "avatar" | "color_scheme";
  name: string;
  rarity: AchievementRarity;
  unlockRequirement: string;
}

// ===========================================================================
// System 9 — Career Statistics
// ===========================================================================

export interface CareerStatistics {
  userId: string;
  lifetime: CareerStatsLifetime;
  perMode: Record<GameModeId, CareerStatsPerMode>;
  perSeason: Record<string, CareerStatsPerSeason>;
  perOrganization: Record<string, CareerStatsPerOrg>;
  perClassroom: Record<string, CareerStatsPerClassroom>;
  perTournament: CareerStatsPerTournament;
}

export interface CareerStatsLifetime {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  accuracy: number;
  totalXP: number;
  totalPlaytimeMs: number;
  longestWinStreak: number;
  currentWinStreak: number;
  achievementsUnlocked: number;
  badgesEarned: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
}

export interface CareerStatsPerMode {
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  totalXP: number;
  playtimeMs: number;
  longestWinStreak: number;
}

export interface CareerStatsPerSeason {
  seasonId: string;
  xp: number;
  matches: number;
  wins: number;
  achievements: number;
  finalLevel: number;
  finalRank: number | null;
}

export interface CareerStatsPerOrg {
  matches: number;
  wins: number;
  contributions: number;
}

export interface CareerStatsPerClassroom {
  matches: number;
  wins: number;
  participation: number;
}

export interface CareerStatsPerTournament {
  played: number;
  won: number;
  finals: number;
  semifinals: number;
  bronze: number;
}

// ===========================================================================
// System 10 — Match History
// ===========================================================================

export interface MatchHistoryEntry {
  id: string;
  userId: string;
  gameMode: GameModeId;
  matchId: string;
  result: "win" | "loss" | "draw" | "participation";
  score: number;
  xpEarned: number;
  achievementsEarned: string[];
  replayAvailable: boolean;
  playedAt: string;
  durationMs: number;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 11 — Seasonal Progression
// ===========================================================================

export type SeasonStatus = "active" | "ended" | "upcoming";

export interface Season {
  id: string;
  name: string;
  seasonNumber: number;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  xpMultiplier: number;
  rewards: SeasonReward[];
  leaderboardEnabled: boolean;
}

export interface SeasonReward {
  id: string;
  tier: string;
  requiredXP: number;
  rewards: string[];
  claimed: boolean;
}

export interface PlayerSeasonProgress {
  userId: string;
  seasonId: string;
  xp: number;
  level: number;
  rank: number | null;
  rewardsClaimed: string[];
  history: SeasonHistoryEntry[];
}

export interface SeasonHistoryEntry {
  seasonId: string;
  seasonNumber: number;
  finalLevel: number;
  finalXP: number;
  finalRank: number | null;
  rewardsClaimed: number;
  achievementsEarned: number;
}

// ===========================================================================
// System 12 — Daily Missions
// ===========================================================================

export type MissionFrequency = "daily" | "weekly" | "monthly";

export interface MissionDefinition {
  id: string;
  name: string;
  description: string;
  frequency: MissionFrequency;
  xpReward: number;
  target: number;
  metric: string;
  gameMode: GameModeId | null;
  /** For teacher missions: the teacher who assigned it. */
  assignedBy: string | null;
  /** Whether this mission is repeatable. */
  repeatable: boolean;
}

export interface PlayerMission {
  missionId: string;
  userId: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
  claimedAt: string | null;
  assignedAt: string;
  expiresAt: string;
}

// ===========================================================================
// System 13 — Weekly Challenges
// ===========================================================================

export type ChallengeScope = "personal" | "classroom" | "organization" | "global";

export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  scope: ChallengeScope;
  frequency: "weekly" | "monthly";
  xpReward: number;
  target: number;
  metric: string;
  startDate: string;
  endDate: string;
  leaderboardId: string | null;
}

export interface PlayerChallenge {
  challengeId: string;
  userId: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
  rank: number | null;
}

// ===========================================================================
// System 14 — Monthly Challenges
// ===========================================================================

export interface MonthlyChallengeDefinition extends ChallengeDefinition {
  frequency: "monthly";
  /** Tiered rewards for top performers. */
  tiers: Array<{ rank: number; reward: string }>;
  leaderboardIntegration: boolean;
}

// ===========================================================================
// System 15 — Event Challenges
// ===========================================================================

export type EventKind = "holiday" | "school" | "olympiad" | "special";

export interface EventChallenge {
  id: string;
  name: string;
  description: string;
  kind: EventKind;
  startDate: string;
  endDate: string;
  xpReward: number;
  badgeId: string | null;
  missions: string[];
  active: boolean;
}

// ===========================================================================
// System 16 — Progress Dashboard
// ===========================================================================

export interface ProgressDashboard {
  userId: string;
  level: number;
  totalXP: number;
  seasonXP: number;
  levelInfo: LevelInfo;
  recentAchievements: PlayerAchievement[];
  equippedTitle: string | null;
  equippedBadges: string[];
  currentMissions: PlayerMission[];
  currentChallenges: PlayerChallenge[];
  seasonProgress: PlayerSeasonProgress | null;
  recentHistory: MatchHistoryEntry[];
  careerSummary: CareerStatsLifetime;
}

// ===========================================================================
// System 17 — Reward Engine
// ===========================================================================

export type RewardKind =
  | "xp"
  | "badge"
  | "title"
  | "cosmetic"
  | "profile_decoration"
  | "certificate";

export interface RewardSpec {
  kind: RewardKind;
  rewardId: string;
  amount: number;
  displayName: string;
}

export interface GrantedReward {
  id: string;
  userId: string;
  kind: RewardKind;
  rewardId: string;
  amount: number;
  displayName: string;
  grantedAt: string;
  grantedBy: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 18 — Milestone Engine
// ===========================================================================

export interface MilestoneDefinition {
  id: string;
  name: string;
  description: string;
  metric: string;
  target: number;
  xpReward: number;
  badgeId: string | null;
  titleId: string | null;
  category: AchievementCategory;
}

// ===========================================================================
// System 19 — Progress Analytics
// ===========================================================================

export interface ProgressAnalytics {
  userId: string;
  xpGrowth: XPGrowthData;
  retention: RetentionData;
  achievementCompletion: AchievementCompletionData;
  missionCompletion: MissionCompletionData;
  progressVelocity: ProgressVelocityData;
  modePreference: ModePreferenceData;
}

export interface XPGrowthData {
  dailyXP: Array<{ date: string; xp: number }>;
  weeklyXP: Array<{ week: string; xp: number }>;
  monthlyXP: Array<{ month: string; xp: number }>;
  xpGrowthRate: number;
}

export interface RetentionData {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  averageSessionLength: number;
  sessionsPerWeek: number;
}

export interface AchievementCompletionData {
  totalAchievements: number;
  unlocked: number;
  completionRate: number;
  byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
}

export interface MissionCompletionData {
  totalAssigned: number;
  completed: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface ProgressVelocityData {
  xpPerDay: number;
  xpPerWeek: number;
  achievementsPerWeek: number;
  levelUpRate: number;
}

export interface ModePreferenceData {
  matchesByMode: Record<GameModeId, number>;
  xpByMode: Record<GameModeId, number>;
  winRateByMode: Record<GameModeId, number>;
  preferredMode: GameModeId | null;
}

// ===========================================================================
// System 20 — Career Timeline
// ===========================================================================

export type CareerEventType =
  | "level_up"
  | "achievement_unlocked"
  | "champion"
  | "season_finish"
  | "teacher_award"
  | "tournament_win"
  | "badge_earned"
  | "title_unlocked"
  | "milestone_reached"
  | "prestige";

export interface CareerTimelineEntry {
  id: string;
  userId: string;
  type: CareerEventType;
  timestamp: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 21 — Import / Export
// ===========================================================================

export interface ProfileExport {
  version: string;
  exportedAt: string;
  userId: string;
  profile: PlayerProfile;
  career: CareerStatistics;
  achievements: PlayerAchievement[];
  badges: PlayerBadge[];
  titles: PlayerTitle[];
  matchHistory: MatchHistoryEntry[];
  timeline: CareerTimelineEntry[];
  seasons: SeasonHistoryEntry[];
}

// ===========================================================================
// System 22 — Progression Dashboard (unified for player/teacher/org/platform)
// ===========================================================================

export type DashboardAudience = "player" | "teacher" | "organization" | "platform";

export interface ProgressionDashboard {
  audience: DashboardAudience;
  userId: string | null;
  organizationId: string | null;
  metrics: ProgressionMetrics;
  topPerformers: Array<{ userId: string; displayName: string; xp: number; level: number }>;
  recentActivity: CareerTimelineEntry[];
  alerts: ProgressionAlert[];
}

export interface ProgressionMetrics {
  totalPlayers: number;
  activePlayers: number;
  totalXP: number;
  averageLevel: number;
  achievementsUnlocked: number;
  missionsCompleted: number;
  retentionRate: number;
}

export interface ProgressionAlert {
  id: string;
  kind: "milestone_near" | "season_ending" | "mission_expiring" | "achievement_close";
  severity: "info" | "warning" | "critical";
  message: string;
  userId: string | null;
  metadata: Record<string, unknown>;
}
