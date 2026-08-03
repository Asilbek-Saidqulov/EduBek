/**
 * Systems 1-4, 9-11, 17-18: Player Profile, Cross-Mode XP, Levels,
 * Prestige, Career Statistics, Match History, Seasonal Progression,
 * Reward Engine, Milestone Engine.
 *
 * All progression updates are EVENT-DRIVEN — game modes emit engine events,
 * this platform consumes them and updates long-term progression.
 *
 * No gameplay mechanics here.
 * No scoring formulas here.
 * Zero engine code modified.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type {
  PlayerProfile,
  PlayerCareer,
  PlayerPreferences,
  GameModeId,
  XPSourceKind,
  XPSourceConfig,
  XPEarnEvent,
  XPConfig,
  LevelCurveConfig,
  LevelInfo,
  LevelUpEvent,
  LevelUpReward,
  PrestigeConfig,
  PrestigeInfo,
  PrestigeHistoryEntry,
  CareerStatistics,
  CareerStatsLifetime,
  CareerStatsPerMode,
  CareerStatsPerOrg,
  CareerStatsPerClassroom,
  CareerStatsPerTournament,
  MatchHistoryEntry,
  Season,
  SeasonReward,
  PlayerSeasonProgress,
  SeasonHistoryEntry,
  RewardSpec,
  GrantedReward,
  MilestoneDefinition,
  MilestoneProgress,
} from "./types";

const log = getLogger("player-progression");

// ===========================================================================
// In-memory state (consistent with Battle Royale pattern)
// ===========================================================================

const profiles = new Map<string, PlayerProfile>();
const xpEvents = new Map<string, XPEarnEvent[]>();
const dailyXPTotals = new Map<string, Map<string, number>>(); // userId → date → sourceKind → total
const levelUpEvents = new Map<string, LevelUpEvent[]>();
const prestigeInfo = new Map<string, PrestigeInfo>();
const careerStats = new Map<string, CareerStatistics>();
const matchHistory = new Map<string, MatchHistoryEntry[]>();
const seasons = new Map<string, Season>();
const playerSeasonProgress = new Map<string, PlayerSeasonProgress[]>();
const grantedRewards = new Map<string, GrantedReward[]>();
const milestoneProgress = new Map<string, MilestoneProgress[]>();

// ===========================================================================
// Default Configurations (configurable, no hardcoded gameplay values)
// ===========================================================================

export const DEFAULT_XP_CONFIG: XPConfig = {
  globalMultiplier: 1.0,
  prestigeMultiplierEnabled: true,
  prestigeMultiplierPerLevel: 0.05,
  sources: [
    { kind: "question_correct", baseAmount: 10, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "perfect_round", baseAmount: 50, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "victory", baseAmount: 100, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "participation", baseAmount: 20, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "comeback", baseAmount: 75, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "tournament_champion", baseAmount: 500, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "achievement", baseAmount: 0, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "daily_mission", baseAmount: 50, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "weekly_mission", baseAmount: 150, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "monthly_challenge", baseAmount: 500, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "event_challenge", baseAmount: 200, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "milestone", baseAmount: 100, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "teacher_award", baseAmount: 100, multiplier: 1.0, enabled: true, dailyCap: 0 },
    { kind: "streak_bonus", baseAmount: 25, multiplier: 1.0, enabled: true, dailyCap: 0 },
  ],
};

export const DEFAULT_LEVEL_CURVE: LevelCurveConfig = {
  type: "exponential",
  baseXP: 100,
  stepXP: 50,
  growthRate: 1.15,
  customThresholds: [],
  maxLevel: 0,
};

export const DEFAULT_PRESTIGE_CONFIG: PrestigeConfig = {
  minLevelToPrestige: 50,
  xpMultiplierPerPrestige: 0.05,
  resetsProgress: true,
  maxPrestige: 20,
};

// Milestone catalog — configurable
export const MILESTONES: MilestoneDefinition[] = [
  { id: "questions_100", name: "Centurion Scholar", description: "Answer 100 questions", metric: "total_questions_correct", target: 100, xpReward: 100, badgeId: "badge_questions_100", titleId: null, category: "career" },
  { id: "questions_1000", name: "Knowledge Seeker", description: "Answer 1,000 questions", metric: "total_questions_correct", target: 1000, xpReward: 500, badgeId: "badge_questions_1000", titleId: "title_scholar", category: "career" },
  { id: "matches_100", name: "Veteran Player", description: "Play 100 matches", metric: "total_matches", target: 100, xpReward: 200, badgeId: "badge_matches_100", titleId: null, category: "career" },
  { id: "wins_500", name: "Champion's Path", description: "Win 500 matches", metric: "total_wins", target: 500, xpReward: 1000, badgeId: "badge_wins_500", titleId: "title_champion", category: "career" },
  { id: "perfect_games_10", name: "Perfectionist", description: "Achieve 10 perfect games", metric: "perfect_games", target: 10, xpReward: 300, badgeId: "badge_perfect_10", titleId: null, category: "competitive" },
  { id: "tournament_wins_5", name: "Tournament Victor", description: "Win 5 tournaments", metric: "tournament_wins", target: 5, xpReward: 750, badgeId: "badge_tournament_5", titleId: "title_strategist", category: "competitive" },
  { id: "teaching_sessions_50", name: "Dedicated Educator", description: "Host 50 teaching sessions", metric: "teaching_sessions", target: 50, xpReward: 400, badgeId: "badge_teaching_50", titleId: "title_teacher", category: "teacher" },
  { id: "org_contributions_100", name: "Community Pillar", description: "Make 100 organization contributions", metric: "org_contributions", target: 100, xpReward: 350, badgeId: "badge_org_100", titleId: null, category: "career" },
];

// ===========================================================================
// System 1 — Unified Player Profile
// ===========================================================================

export function createProfile(userId: string, displayName: string): PlayerProfile {
  const existing = profiles.get(userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const profile: PlayerProfile = {
    userId,
    displayName,
    avatarUrl: null,
    bannerUrl: null,
    frameId: null,
    borderId: null,
    titleId: null,
    prestigeLevel: 0,
    level: 1,
    totalXP: 0,
    seasonXP: 0,
    currentSeasonId: null,
    career: {
      totalMatches: 0,
      totalWins: 0,
      totalQuestionsAnswered: 0,
      totalQuestionsCorrect: 0,
      totalTournamentsPlayed: 0,
      totalTournamentsWon: 0,
      totalPlaytimeMs: 0,
      firstMatchAt: null,
      lastMatchAt: null,
    },
    preferences: {
      preferredMode: null,
      privacyLevel: "public",
      showInLeaderboards: true,
      notificationsEnabled: true,
      language: "en",
    },
    milestones: MILESTONES.map(m => ({
      milestoneId: m.id,
      currentValue: 0,
      targetValue: m.target,
      achieved: false,
      achievedAt: null,
    })),
    createdAt: now,
    updatedAt: now,
  };
  profiles.set(userId, profile);

  // Initialize prestige + career stats
  prestigeInfo.set(userId, {
    userId,
    prestigeLevel: 0,
    canPrestige: false,
    totalPrestiges: 0,
    history: [],
    badges: [],
    rewards: [],
  });
  careerStats.set(userId, {
    userId,
    lifetime: emptyLifetime(),
    perMode: emptyPerMode(),
    perSeason: {},
    perOrganization: {},
    perClassroom: {},
    perTournament: { played: 0, won: 0, finals: 0, semifinals: 0, bronze: 0 },
  });
  matchHistory.set(userId, []);
  xpEvents.set(userId, []);
  levelUpEvents.set(userId, []);
  grantedRewards.set(userId, []);

  log.info("profile.created", { userId, displayName });
  return profile;
}

function emptyLifetime(): CareerStatsLifetime {
  return {
    totalMatches: 0, totalWins: 0, totalLosses: 0, winRate: 0,
    totalQuestionsAnswered: 0, totalQuestionsCorrect: 0, accuracy: 0,
    totalXP: 0, totalPlaytimeMs: 0, longestWinStreak: 0, currentWinStreak: 0,
    achievementsUnlocked: 0, badgesEarned: 0, tournamentsPlayed: 0, tournamentsWon: 0,
  };
}

function emptyPerMode(): Record<GameModeId, CareerStatsPerMode> {
  const result = {} as Record<GameModeId, CareerStatsPerMode>;
  const modes: GameModeId[] = ["classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale"];
  for (const m of modes) {
    result[m] = {
      matches: 0, wins: 0, losses: 0, winRate: 0,
      questionsAnswered: 0, questionsCorrect: 0, accuracy: 0,
      totalXP: 0, playtimeMs: 0, longestWinStreak: 0,
    };
  }
  return result;
}

export function getProfile(userId: string): PlayerProfile | null {
  return profiles.get(userId) ?? null;
}

export function updatePreferences(userId: string, prefs: Partial<PlayerPreferences>): boolean {
  const p = profiles.get(userId);
  if (!p) return false;
  p.preferences = { ...p.preferences, ...prefs };
  p.updatedAt = new Date().toISOString();
  return true;
}

export function setAvatar(userId: string, avatarUrl: string): boolean {
  const p = profiles.get(userId);
  if (!p) return false;
  p.avatarUrl = avatarUrl;
  p.updatedAt = new Date().toISOString();
  return true;
}

export function setBanner(userId: string, bannerUrl: string): boolean {
  const p = profiles.get(userId);
  if (!p) return false;
  p.bannerUrl = bannerUrl;
  p.updatedAt = new Date().toISOString();
  return true;
}

// ===========================================================================
// System 2 — Cross-Mode XP Engine
// ===========================================================================

let xpConfig: XPConfig = { ...DEFAULT_XP_CONFIG };

export function getXPConfig(): XPConfig {
  return { ...xpConfig };
}

export function setXPConfig(config: Partial<XPConfig>): void {
  xpConfig = { ...xpConfig, ...config };
}

export function getSourceConfig(kind: XPSourceKind): XPSourceConfig | null {
  return xpConfig.sources.find(s => s.kind === kind) ?? null;
}

export function setSourceConfig(kind: XPSourceKind, updates: Partial<XPSourceConfig>): boolean {
  const source = xpConfig.sources.find(s => s.kind === kind);
  if (!source) return false;
  Object.assign(source, updates);
  return true;
}

/**
 * Award XP to a player. This is the SINGLE ENTRY POINT for all XP grants.
 * Game modes call this (indirectly via events) — they never modify XP directly.
 */
export function awardXP(input: {
  userId: string;
  source: XPSourceKind;
  gameMode?: GameModeId | null;
  matchId?: string | null;
  amount?: number;
  metadata?: Record<string, unknown>;
}): XPEarnEvent {
  const profile = profiles.get(input.userId) ?? createProfile(input.userId, input.userId);
  const sourceConfig = getSourceConfig(input.source);
  const baseAmount = input.amount ?? sourceConfig?.baseAmount ?? 0;
  const sourceMultiplier = sourceConfig?.multiplier ?? 1.0;

  // Apply daily cap if configured
  const today = new Date().toISOString().split("T")[0];
  const userDaily = dailyXPTotals.get(input.userId) ?? new Map<string, number>();
  const dailyKey = `${today}:${input.source}`;
  const currentDaily = userDaily.get(dailyKey) ?? 0;
  const dailyCap = sourceConfig?.dailyCap ?? 0;
  let cappedAmount = baseAmount;
  if (dailyCap > 0) {
    cappedAmount = Math.min(baseAmount, Math.max(0, dailyCap - currentDaily));
  }

  // Apply multipliers: source × global × prestige
  const prestigeMult = xpConfig.prestigeMultiplierEnabled
    ? 1 + (profile.prestigeLevel * xpConfig.prestigeMultiplierPerLevel)
    : 1.0;
  const finalAmount = Math.round(cappedAmount * sourceMultiplier * xpConfig.globalMultiplier * prestigeMult);

  // Update daily totals
  if (dailyCap > 0) {
    userDaily.set(dailyKey, currentDaily + cappedAmount);
    dailyXPTotals.set(input.userId, userDaily);
  }

  const event: XPEarnEvent = {
    id: randomUUID(),
    userId: input.userId,
    source: input.source,
    amount: finalAmount,
    gameMode: input.gameMode ?? null,
    matchId: input.matchId ?? null,
    seasonId: profile.currentSeasonId,
    timestamp: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };

  const events = xpEvents.get(input.userId) ?? [];
  events.push(event);
  xpEvents.set(input.userId, events);

  // Apply XP to profile
  profile.totalXP += finalAmount;
  profile.seasonXP += finalAmount;
  profile.updatedAt = event.timestamp;

  // Update career stats
  const career = careerStats.get(input.userId);
  if (career) {
    career.lifetime.totalXP += finalAmount;
    if (input.gameMode) {
      career.perMode[input.gameMode].totalXP += finalAmount;
    }
  }

  // Update season progress
  if (profile.currentSeasonId) {
    const seasonsList = playerSeasonProgress.get(input.userId) ?? [];
    const seasonProg = seasonsList.find(s => s.seasonId === profile.currentSeasonId);
    if (seasonProg) {
      seasonProg.xp += finalAmount;
      seasonProg.level = computeLevel(seasonProg.xp).level;
    }
  }

  // Check for level-up
  const oldLevel = profile.level;
  const newLevelInfo = computeLevel(profile.totalXP);
  if (newLevelInfo.level > oldLevel) {
    profile.level = newLevelInfo.level;
    recordLevelUp(input.userId, oldLevel, newLevelInfo.level);
  }

  // Update milestones
  updateMilestonesForXP(input.userId);

  log.debug("xp.awarded", { userId: input.userId, source: input.source, amount: finalAmount });
  return event;
}

export function getXPEvents(userId: string): XPEarnEvent[] {
  return xpEvents.get(userId) ?? [];
}

export function getTotalXP(userId: string): number {
  return profiles.get(userId)?.totalXP ?? 0;
}

export function getSeasonXP(userId: string): number {
  return profiles.get(userId)?.seasonXP ?? 0;
}

// ===========================================================================
// System 3 — Level Engine
// ===========================================================================

let levelCurve: LevelCurveConfig = { ...DEFAULT_LEVEL_CURVE };

export function getLevelCurve(): LevelCurveConfig {
  return { ...levelCurve };
}

export function setLevelCurve(config: Partial<LevelCurveConfig>): void {
  levelCurve = { ...levelCurve, ...config };
}

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  switch (levelCurve.type) {
    case "linear":
      return levelCurve.baseXP + (level - 1) * levelCurve.stepXP;
    case "exponential":
      // Level 2 costs baseXP, level 3 costs baseXP * growthRate, etc.
      return Math.round(levelCurve.baseXP * Math.pow(levelCurve.growthRate, level - 2));
    case "custom":
      return levelCurve.customThresholds[level - 2] ?? (levelCurve.baseXP * level);
    case "seasonal":
      return Math.round(levelCurve.baseXP * Math.pow(levelCurve.growthRate, level - 2));
    default:
      return levelCurve.baseXP * level;
  }
}

export function computeLevel(totalXP: number): LevelInfo {
  let level = 1;
  let cumulative = 0;
  while (true) {
    if (levelCurve.maxLevel > 0 && level >= levelCurve.maxLevel) {
      return {
        level, currentXP: totalXP - cumulative, xpForCurrentLevel: cumulative,
        xpForNextLevel: cumulative, xpToNextLevel: 0, progressPct: 100, isMaxLevel: true,
      };
    }
    const next = xpRequiredForLevel(level + 1);
    if (totalXP < next) {
      const xpForCurrent = cumulative;
      const xpForNext = next;
      const xpToNext = xpForNext - totalXP;
      const levelSpan = xpForNext - xpForCurrent;
      const progressPct = levelSpan > 0 ? Math.round(((totalXP - xpForCurrent) / levelSpan) * 100) : 0;
      return {
        level, currentXP: totalXP - xpForCurrent, xpForCurrentLevel: xpForCurrent,
        xpForNextLevel: xpForNext, xpToNextLevel: xpToNext, progressPct, isMaxLevel: false,
      };
    }
    cumulative = next;
    level++;
  }
}

export function getLevelInfo(userId: string): LevelInfo {
  const profile = profiles.get(userId);
  return computeLevel(profile?.totalXP ?? 0);
}

function recordLevelUp(userId: string, previousLevel: number, newLevel: number): LevelUpEvent {
  const rewards: LevelUpReward[] = [];
  // Standard level-up rewards (cosmetic only — no gameplay advantage)
  if (newLevel % 10 === 0) {
    rewards.push({ kind: "badge", rewardId: `badge_level_${newLevel}`, displayName: `Level ${newLevel} Badge` });
  }
  if (newLevel % 25 === 0) {
    rewards.push({ kind: "title", rewardId: `title_level_${newLevel}`, displayName: `Level ${newLevel} Title` });
  }
  rewards.push({ kind: "cosmetic", rewardId: `frame_level_${newLevel}`, displayName: `Level ${newLevel} Frame` });

  const event: LevelUpEvent = {
    id: randomUUID(),
    userId,
    newLevel,
    previousLevel,
    timestamp: new Date().toISOString(),
    rewards,
  };
  const events = levelUpEvents.get(userId) ?? [];
  events.push(event);
  levelUpEvents.set(userId, events);
  log.info("level.up", { userId, previousLevel, newLevel });
  return event;
}

export function getLevelUpEvents(userId: string): LevelUpEvent[] {
  return levelUpEvents.get(userId) ?? [];
}

// ===========================================================================
// System 4 — Prestige System
// ===========================================================================

let prestigeConfig: PrestigeConfig = { ...DEFAULT_PRESTIGE_CONFIG };

export function getPrestigeConfig(): PrestigeConfig {
  return { ...prestigeConfig };
}

export function setPrestigeConfig(config: Partial<PrestigeConfig>): void {
  prestigeConfig = { ...prestigeConfig, ...config };
}

export function getPrestigeInfo(userId: string): PrestigeInfo {
  const info = prestigeInfo.get(userId);
  if (info) {
    const profile = profiles.get(userId);
    info.canPrestige = profile !== undefined && profile.level >= prestigeConfig.minLevelToPrestige
      && (prestigeConfig.maxPrestige === 0 || info.prestigeLevel < prestigeConfig.maxPrestige);
    return info;
  }
  return {
    userId, prestigeLevel: 0, canPrestige: false, totalPrestiges: 0, history: [], badges: [], rewards: [],
  };
}

export function prestige(userId: string): PrestigeInfo | null {
  const profile = profiles.get(userId);
  if (!profile) return null;
  const info = prestigeInfo.get(userId);
  if (!info) return null;
  if (profile.level < prestigeConfig.minLevelToPrestige) return null;
  if (prestigeConfig.maxPrestige > 0 && info.prestigeLevel >= prestigeConfig.maxPrestige) return null;

  const entry: PrestigeHistoryEntry = {
    prestigeLevel: info.prestigeLevel + 1,
    timestamp: new Date().toISOString(),
    levelAtPrestige: profile.level,
    xpAtPrestige: profile.totalXP,
  };
  info.prestigeLevel += 1;
  info.totalPrestiges += 1;
  info.history.push(entry);
  info.badges.push(`badge_prestige_${info.prestigeLevel}`);
  info.rewards.push(`cosmetic_prestige_${info.prestigeLevel}`);

  if (prestigeConfig.resetsProgress) {
    profile.level = 1;
    profile.totalXP = 0;
  }
  profile.prestigeLevel = info.prestigeLevel;
  profile.updatedAt = entry.timestamp;
  log.info("prestige", { userId, prestigeLevel: info.prestigeLevel });
  return info;
}

// ===========================================================================
// System 9 — Career Statistics
// ===========================================================================

export function getCareerStatistics(userId: string): CareerStatistics | null {
  return careerStats.get(userId) ?? null;
}

export function recordMatchResult(input: {
  userId: string;
  gameMode: GameModeId;
  result: "win" | "loss" | "draw" | "participation";
  score: number;
  questionsAnswered?: number;
  questionsCorrect?: number;
  durationMs: number;
  matchId: string;
  organizationId?: string | null;
  classroomId?: string | null;
  isTournament?: boolean;
  tournamentResult?: "champion" | "runner_up" | "semifinal" | "bronze" | null;
  replayAvailable?: boolean;
}): MatchHistoryEntry {
  const profile = profiles.get(input.userId) ?? createProfile(input.userId, input.userId);
  const career = careerStats.get(input.userId)!;
  const now = new Date().toISOString();

  // Update lifetime stats
  career.lifetime.totalMatches += 1;
  if (input.result === "win") {
    career.lifetime.totalWins += 1;
    career.lifetime.currentWinStreak += 1;
    career.lifetime.longestWinStreak = Math.max(career.lifetime.longestWinStreak, career.lifetime.currentWinStreak);
  } else if (input.result === "loss") {
    career.lifetime.totalLosses += 1;
    career.lifetime.currentWinStreak = 0;
  }
  career.lifetime.totalQuestionsAnswered += input.questionsAnswered ?? 0;
  career.lifetime.totalQuestionsCorrect += input.questionsCorrect ?? 0;
  career.lifetime.accuracy = career.lifetime.totalQuestionsAnswered > 0
    ? Math.round((career.lifetime.totalQuestionsCorrect / career.lifetime.totalQuestionsAnswered) * 100) / 100
    : 0;
  career.lifetime.winRate = career.lifetime.totalMatches > 0
    ? Math.round((career.lifetime.totalWins / career.lifetime.totalMatches) * 100) / 100
    : 0;
  career.lifetime.totalPlaytimeMs += input.durationMs;

  // Update per-mode stats
  const modeStats = career.perMode[input.gameMode];
  modeStats.matches += 1;
  if (input.result === "win") modeStats.wins += 1;
  if (input.result === "loss") modeStats.losses += 1;
  modeStats.questionsAnswered += input.questionsAnswered ?? 0;
  modeStats.questionsCorrect += input.questionsCorrect ?? 0;
  modeStats.accuracy = modeStats.questionsAnswered > 0
    ? Math.round((modeStats.questionsCorrect / modeStats.questionsAnswered) * 100) / 100
    : 0;
  modeStats.winRate = modeStats.matches > 0
    ? Math.round((modeStats.wins / modeStats.matches) * 100) / 100
    : 0;
  modeStats.playtimeMs += input.durationMs;

  // Update per-org stats
  if (input.organizationId) {
    const orgStats = career.perOrganization[input.organizationId] ?? { matches: 0, wins: 0, contributions: 0 };
    orgStats.matches += 1;
    if (input.result === "win") orgStats.wins += 1;
    career.perOrganization[input.organizationId] = orgStats;
  }

  // Update per-classroom stats
  if (input.classroomId) {
    const classStats = career.perClassroom[input.classroomId] ?? { matches: 0, wins: 0, participation: 0 };
    classStats.matches += 1;
    if (input.result === "win") classStats.wins += 1;
    classStats.participation += 1;
    career.perClassroom[input.classroomId] = classStats;
  }

  // Update tournament stats
  if (input.isTournament) {
    career.lifetime.tournamentsPlayed += 1;
    career.perTournament.played += 1;
    if (input.tournamentResult === "champion") {
      career.lifetime.tournamentsWon += 1;
      career.perTournament.won += 1;
    } else if (input.tournamentResult === "runner_up") {
      career.perTournament.finals += 1;
    } else if (input.tournamentResult === "semifinal") {
      career.perTournament.semifinals += 1;
    } else if (input.tournamentResult === "bronze") {
      career.perTournament.bronze += 1;
    }
  }

  // Update profile career
  profile.career.totalMatches = career.lifetime.totalMatches;
  profile.career.totalWins = career.lifetime.totalWins;
  profile.career.totalQuestionsAnswered = career.lifetime.totalQuestionsAnswered;
  profile.career.totalQuestionsCorrect = career.lifetime.totalQuestionsCorrect;
  profile.career.totalTournamentsPlayed = career.lifetime.tournamentsPlayed;
  profile.career.totalTournamentsWon = career.lifetime.tournamentsWon;
  profile.career.totalPlaytimeMs = career.lifetime.totalPlaytimeMs;
  profile.career.lastMatchAt = now;
  if (!profile.career.firstMatchAt) profile.career.firstMatchAt = now;
  profile.updatedAt = now;

  // Build match history entry
  const entry: MatchHistoryEntry = {
    id: randomUUID(),
    userId: input.userId,
    gameMode: input.gameMode,
    matchId: input.matchId,
    result: input.result,
    score: input.score,
    xpEarned: 0,
    achievementsEarned: [],
    replayAvailable: input.replayAvailable ?? false,
    playedAt: now,
    durationMs: input.durationMs,
    metadata: { organizationId: input.organizationId, classroomId: input.classroomId, isTournament: input.isTournament },
  };
  const history = matchHistory.get(input.userId) ?? [];
  history.push(entry);
  matchHistory.set(input.userId, history);

  // Update milestones based on career metrics
  updateMilestones(input.userId, {
    total_matches: career.lifetime.totalMatches,
    total_wins: career.lifetime.totalWins,
    total_questions_correct: career.lifetime.totalQuestionsCorrect,
    tournament_wins: career.lifetime.tournamentsWon,
  });

  log.debug("career.match_recorded", { userId: input.userId, gameMode: input.gameMode, result: input.result });
  return entry;
}

export function getMatchHistory(userId: string, limit = 50): MatchHistoryEntry[] {
  const history = matchHistory.get(userId) ?? [];
  return history.slice(-limit).reverse();
}

// ===========================================================================
// System 11 — Seasonal Progression
// ===========================================================================

export function createSeason(input: {
  name: string;
  seasonNumber: number;
  startDate: string;
  endDate: string;
  xpMultiplier?: number;
  rewards?: SeasonReward[];
  leaderboardEnabled?: boolean;
}): Season {
  const id = randomUUID();
  const now = new Date();
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const status = now < start ? "upcoming" : now > end ? "ended" : "active";
  const season: Season = {
    id,
    name: input.name,
    seasonNumber: input.seasonNumber,
    startDate: input.startDate,
    endDate: input.endDate,
    status,
    xpMultiplier: input.xpMultiplier ?? 1.0,
    rewards: input.rewards ?? [],
    leaderboardEnabled: input.leaderboardEnabled ?? true,
  };
  seasons.set(id, season);
  log.info("season.created", { id, name: input.name, seasonNumber: input.seasonNumber });
  return season;
}

export function getSeason(seasonId: string): Season | null {
  return seasons.get(seasonId) ?? null;
}

export function listSeasons(): Season[] {
  return Array.from(seasons.values());
}

export function getActiveSeason(): Season | null {
  const now = new Date();
  for (const s of seasons.values()) {
    if (new Date(s.startDate) <= now && now <= new Date(s.endDate)) {
      s.status = "active";
      return s;
    }
  }
  return null;
}

export function enrollInSeason(userId: string, seasonId: string): PlayerSeasonProgress | null {
  const season = seasons.get(seasonId);
  if (!season) return null;
  const profile = profiles.get(userId);
  if (!profile) return null;
  profile.currentSeasonId = seasonId;
  const list = playerSeasonProgress.get(userId) ?? [];
  let progress = list.find(p => p.seasonId === seasonId);
  if (!progress) {
    progress = {
      userId, seasonId, xp: 0, level: 1, rank: null, rewardsClaimed: [], history: [],
    };
    list.push(progress);
    playerSeasonProgress.set(userId, list);
  }
  return progress;
}

export function getSeasonProgress(userId: string, seasonId: string): PlayerSeasonProgress | null {
  const list = playerSeasonProgress.get(userId) ?? [];
  return list.find(p => p.seasonId === seasonId) ?? null;
}

export function endSeason(seasonId: string): SeasonHistoryEntry[] {
  const season = seasons.get(seasonId);
  if (!season) return [];
  season.status = "ended";
  const historyEntries: SeasonHistoryEntry[] = [];
  for (const [userId, list] of playerSeasonProgress.entries()) {
    const prog = list.find(p => p.seasonId === seasonId);
    if (prog) {
      const entry: SeasonHistoryEntry = {
        seasonId,
        seasonNumber: season.seasonNumber,
        finalLevel: prog.level,
        finalXP: prog.xp,
        finalRank: prog.rank,
        rewardsClaimed: prog.rewardsClaimed.length,
        achievementsEarned: 0,
      };
      prog.history.push(entry);
      historyEntries.push(entry);
      // Clear currentSeasonId if it was this season
      const profile = profiles.get(userId);
      if (profile && profile.currentSeasonId === seasonId) {
        profile.currentSeasonId = null;
        profile.seasonXP = 0;
      }
    }
  }
  log.info("season.ended", { seasonId, entries: historyEntries.length });
  return historyEntries;
}

// ===========================================================================
// System 17 — Reward Engine
// ===========================================================================

export function grantReward(input: {
  userId: string;
  kind: GrantedReward["kind"];
  rewardId: string;
  amount?: number;
  displayName: string;
  grantedBy?: string | null;
  metadata?: Record<string, unknown>;
}): GrantedReward {
  const reward: GrantedReward = {
    id: randomUUID(),
    userId: input.userId,
    kind: input.kind,
    rewardId: input.rewardId,
    amount: input.amount ?? 1,
    displayName: input.displayName,
    grantedAt: new Date().toISOString(),
    grantedBy: input.grantedBy ?? null,
    metadata: input.metadata ?? {},
  };
  const list = grantedRewards.get(input.userId) ?? [];
  list.push(reward);
  grantedRewards.set(input.userId, list);
  log.info("reward.granted", { userId: input.userId, kind: input.kind, rewardId: input.rewardId });
  return reward;
}

export function getGrantedRewards(userId: string): GrantedReward[] {
  return grantedRewards.get(userId) ?? [];
}

export function grantRewards(userId: string, rewards: RewardSpec[], grantedBy?: string | null): GrantedReward[] {
  return rewards.map(r => grantReward({
    userId,
    kind: r.kind,
    rewardId: r.rewardId,
    amount: r.amount,
    displayName: r.displayName,
    grantedBy,
  }));
}

// ===========================================================================
// System 18 — Milestone Engine
// ===========================================================================

export function getMilestones(): MilestoneDefinition[] {
  return [...MILESTONES];
}

export function getMilestoneProgress(userId: string): MilestoneProgress[] {
  const profile = profiles.get(userId);
  return profile?.milestones ?? [];
}

export function updateMilestones(userId: string, metrics: Record<string, number>): MilestoneProgress[] {
  const profile = profiles.get(userId);
  if (!profile) return [];
  const updated: MilestoneProgress[] = [];
  for (const milestone of MILESTONES) {
    const progress = profile.milestones.find(m => m.milestoneId === milestone.id);
    if (!progress || progress.achieved) continue;
    const currentValue = metrics[milestone.metric] ?? progress.currentValue;
    progress.currentValue = currentValue;
    if (currentValue >= progress.targetValue && !progress.achieved) {
      progress.achieved = true;
      progress.achievedAt = new Date().toISOString();
      // Award XP for milestone
      awardXP({
        userId,
        source: "milestone",
        amount: milestone.xpReward,
        metadata: { milestoneId: milestone.id },
      });
      // Grant badge if configured
      if (milestone.badgeId) {
        grantReward({
          userId,
          kind: "badge",
          rewardId: milestone.badgeId,
          displayName: milestone.name,
        });
      }
      // Grant title if configured
      if (milestone.titleId) {
        grantReward({
          userId,
          kind: "title",
          rewardId: milestone.titleId,
          displayName: milestone.name,
        });
      }
    }
    updated.push(progress);
  }
  profile.updatedAt = new Date().toISOString();
  return updated;
}

function updateMilestonesForXP(userId: string): void {
  // Update XP-based milestones
  const profile = profiles.get(userId);
  if (!profile) return;
  const career = careerStats.get(userId);
  if (!career) return;
  updateMilestones(userId, {
    total_matches: career.lifetime.totalMatches,
    total_wins: career.lifetime.totalWins,
    total_questions_correct: career.lifetime.totalQuestionsCorrect,
    tournament_wins: career.lifetime.tournamentsWon,
    total_xp: profile.totalXP,
  });
}

// Exported for testing — resets all in-memory state
export function _resetForTesting(): void {
  profiles.clear();
  xpEvents.clear();
  dailyXPTotals.clear();
  levelUpEvents.clear();
  prestigeInfo.clear();
  careerStats.clear();
  matchHistory.clear();
  seasons.clear();
  playerSeasonProgress.clear();
  grantedRewards.clear();
  milestoneProgress.clear();
  xpConfig = { ...DEFAULT_XP_CONFIG };
  levelCurve = { ...DEFAULT_LEVEL_CURVE };
  prestigeConfig = { ...DEFAULT_PRESTIGE_CONFIG };
}
