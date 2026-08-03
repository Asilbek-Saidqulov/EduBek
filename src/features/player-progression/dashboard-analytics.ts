/**
 * Systems 16, 19-22: Progress Dashboard, Progress Analytics,
 * Career Timeline, Import/Export, Progression Dashboard.
 *
 * All read-only aggregations over the in-memory state maintained by
 * progression-engine.ts and achievement-profile.ts.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  getProfile, getCareerStatistics, getMatchHistory, getXPEvents,
  getLevelInfo, getSeasonProgress, listSeasons, getActiveSeason,
  getMilestoneProgress, getGrantedRewards,
} from "./progression-engine";
import {
  getPlayerAchievements, getPlayerBadges, getPlayerTitles,
  getPlayerMissions, getPlayerChallenges, listAchievements,
} from "./achievement-profile";
import type {
  ProgressDashboard,
  ProgressAnalytics,
  XPGrowthData,
  RetentionData,
  AchievementCompletionData,
  MissionCompletionData,
  ProgressVelocityData,
  ModePreferenceData,
  CareerTimelineEntry,
  CareerEventType,
  ProfileExport,
  ProgressionDashboard,
  DashboardAudience,
  ProgressionMetrics,
  ProgressionAlert,
  GameModeId,
  AchievementCategory,
} from "./types";

const log = getLogger("player-progression");

// ===========================================================================
// In-memory timeline store
// ===========================================================================

const timelines = new Map<string, CareerTimelineEntry[]>();

/** Reset all in-memory state for testing. */
export function _resetDashboardForTesting(): void {
  timelines.clear();
}

function recordTimeline(userId: string, type: CareerEventType, title: string, description: string, metadata: Record<string, unknown> = {}): CareerTimelineEntry {
  const entry: CareerTimelineEntry = {
    id: randomUUID(),
    userId,
    type,
    timestamp: new Date().toISOString(),
    title,
    description,
    metadata,
  };
  const list = timelines.get(userId) ?? [];
  list.push(entry);
  timelines.set(userId, list);
  return entry;
}

export function recordLevelUpTimeline(userId: string, newLevel: number): CareerTimelineEntry {
  return recordTimeline(userId, "level_up", `Reached Level ${newLevel}`, `Achieved level ${newLevel}`, { newLevel });
}

export function recordAchievementTimeline(userId: string, achievementId: string, name: string): CareerTimelineEntry {
  return recordTimeline(userId, "achievement_unlocked", `Achievement: ${name}`, `Unlocked achievement "${name}"`, { achievementId });
}

export function recordTournamentWinTimeline(userId: string, tournamentName: string): CareerTimelineEntry {
  return recordTimeline(userId, "tournament_win", `Won Tournament: ${tournamentName}`, `Won the tournament "${tournamentName}"`, { tournamentName });
}

export function recordBadgeTimeline(userId: string, badgeId: string, name: string): CareerTimelineEntry {
  return recordTimeline(userId, "badge_earned", `Badge: ${name}`, `Earned badge "${name}"`, { badgeId });
}

export function recordTitleTimeline(userId: string, titleId: string, name: string): CareerTimelineEntry {
  return recordTimeline(userId, "title_unlocked", `Title: ${name}`, `Unlocked title "${name}"`, { titleId });
}

export function recordMilestoneTimeline(userId: string, milestoneId: string, name: string): CareerTimelineEntry {
  return recordTimeline(userId, "milestone_reached", `Milestone: ${name}`, `Reached milestone "${name}"`, { milestoneId });
}

export function recordPrestigeTimeline(userId: string, prestigeLevel: number): CareerTimelineEntry {
  return recordTimeline(userId, "prestige", `Prestige ${prestigeLevel}`, `Reached prestige level ${prestigeLevel}`, { prestigeLevel });
}

export function recordChampionTimeline(userId: string, seasonName: string): CareerTimelineEntry {
  return recordTimeline(userId, "champion", `Champion: ${seasonName}`, `Became champion of ${seasonName}`, { seasonName });
}

export function recordSeasonFinishTimeline(userId: string, seasonName: string, rank: number | null): CareerTimelineEntry {
  return recordTimeline(userId, "season_finish", `Season Finished: ${seasonName}`, `Finished ${seasonName}${rank ? ` at rank #${rank}` : ""}`, { seasonName, rank });
}

export function recordTeacherAwardTimeline(userId: string, awardName: string, teacherId: string): CareerTimelineEntry {
  return recordTimeline(userId, "teacher_award", `Teacher Award: ${awardName}`, `Received award "${awardName}" from teacher`, { awardName, teacherId });
}

export function getCareerTimeline(userId: string, limit = 50): CareerTimelineEntry[] {
  const list = timelines.get(userId) ?? [];
  return list.slice(-limit).reverse();
}

// ===========================================================================
// System 16 — Progress Dashboard
// ===========================================================================

export function generateProgressDashboard(userId: string): ProgressDashboard | null {
  const profile = getProfile(userId);
  if (!profile) return null;
  const career = getCareerStatistics(userId);
  const levelInfo = getLevelInfo(userId);
  const achievements = getPlayerAchievements(userId);
  const badges = getPlayerBadges(userId);
  const titles = getPlayerTitles(userId);
  const missions = getPlayerMissions(userId);
  const challenges = getPlayerChallenges(userId);
  const history = getMatchHistory(userId, 10);
  const activeSeason = getActiveSeason();
  const seasonProgress = activeSeason ? getSeasonProgress(userId, activeSeason.id) : null;

  const equippedTitle = titles.find(t => t.equipped);
  const equippedBadges = badges.slice(0, 5).map(b => b.badgeId);

  return {
    userId,
    level: profile.level,
    totalXP: profile.totalXP,
    seasonXP: profile.seasonXP,
    levelInfo,
    recentAchievements: achievements.slice(-5).reverse(),
    equippedTitle: equippedTitle?.titleId ?? null,
    equippedBadges,
    currentMissions: missions.filter(m => !m.completed),
    currentChallenges: challenges.filter(c => !c.completed),
    seasonProgress,
    recentHistory: history,
    careerSummary: career?.lifetime ?? {
      totalMatches: 0, totalWins: 0, totalLosses: 0, winRate: 0,
      totalQuestionsAnswered: 0, totalQuestionsCorrect: 0, accuracy: 0,
      totalXP: 0, totalPlaytimeMs: 0, longestWinStreak: 0, currentWinStreak: 0,
      achievementsUnlocked: 0, badgesEarned: 0, tournamentsPlayed: 0, tournamentsWon: 0,
    },
  };
}

// ===========================================================================
// System 19 — Progress Analytics
// ===========================================================================

export function generateProgressAnalytics(userId: string): ProgressAnalytics | null {
  const profile = getProfile(userId);
  if (!profile) return null;
  const career = getCareerStatistics(userId);
  const xpEvents = getXPEvents(userId);
  const achievements = getPlayerAchievements(userId);
  const missions = getPlayerMissions(userId);
  const history = getMatchHistory(userId, 1000);

  return {
    userId,
    xpGrowth: computeXPGrowth(userId, xpEvents),
    retention: computeRetention(userId, history),
    achievementCompletion: computeAchievementCompletion(userId, achievements),
    missionCompletion: computeMissionCompletion(userId, missions),
    progressVelocity: computeProgressVelocity(userId, xpEvents, achievements),
    modePreference: computeModePreference(userId, career, history),
  };
}

function computeXPGrowth(userId: string, xpEvents: ReturnType<typeof getXPEvents>): XPGrowthData {
  const dailyMap = new Map<string, number>();
  const weeklyMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();

  for (const e of xpEvents) {
    const d = new Date(e.timestamp);
    const dayKey = d.toISOString().split("T")[0];
    const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + e.amount);
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) ?? 0) + e.amount);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + e.amount);
  }

  const dailyXP = Array.from(dailyMap.entries()).map(([date, xp]) => ({ date, xp })).sort((a, b) => a.date.localeCompare(b.date));
  const weeklyXP = Array.from(weeklyMap.entries()).map(([week, xp]) => ({ week, xp })).sort((a, b) => a.week.localeCompare(b.week));
  const monthlyXP = Array.from(monthlyMap.entries()).map(([month, xp]) => ({ month, xp })).sort((a, b) => a.month.localeCompare(b.month));

  // XP growth rate: avg daily XP over last 7 days vs previous 7 days
  const last7 = dailyXP.slice(-7).reduce((s, d) => s + d.xp, 0);
  const prev7 = dailyXP.slice(-14, -7).reduce((s, d) => s + d.xp, 0);
  const xpGrowthRate = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) / 100 : (last7 > 0 ? 1 : 0);

  return { dailyXP, weeklyXP, monthlyXP, xpGrowthRate };
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

function computeRetention(userId: string, history: ReturnType<typeof getMatchHistory>): RetentionData {
  if (history.length === 0) {
    return { day1Retention: 0, day7Retention: 0, day30Retention: 0, averageSessionLength: 0, sessionsPerWeek: 0 };
  }
  const sorted = [...history].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
  const firstPlay = new Date(sorted[0].playedAt);
  const lastPlay = new Date(sorted[sorted.length - 1].playedAt);
  const daysActive = new Set<string>();
  for (const h of sorted) {
    daysActive.add(h.playedAt.split("T")[0]);
  }
  const day1 = daysActive.size >= 2 ? 1 : 0;
  const day7 = (lastPlay.getTime() - firstPlay.getTime()) >= 7 * 86_400_000 ? 1 : 0;
  const day30 = (lastPlay.getTime() - firstPlay.getTime()) >= 30 * 86_400_000 ? 1 : 0;
  const avgSession = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.durationMs, 0) / history.length)
    : 0;
  const weeksSpan = Math.max(1, (lastPlay.getTime() - firstPlay.getTime()) / (7 * 86_400_000));
  return {
    day1Retention: day1,
    day7Retention: day7,
    day30Retention: day30,
    averageSessionLength: avgSession,
    sessionsPerWeek: Math.round(history.length / weeksSpan),
  };
}

function computeAchievementCompletion(userId: string, achievements: ReturnType<typeof getPlayerAchievements>): AchievementCompletionData {
  const all = listAchievements();
  const total = all.length;
  const unlocked = achievements.length;
  const byCategory: Record<AchievementCategory, { total: number; unlocked: number }> = {} as Record<AchievementCategory, { total: number; unlocked: number }>;
  const categories: AchievementCategory[] = ["classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale", "cross_mode", "social", "competitive", "seasonal", "secret", "teacher", "career"];
  for (const cat of categories) {
    const inCat = all.filter(a => a.category === cat);
    const unlockedInCat = achievements.filter(a => all.find(def => def.id === a.achievementId)?.category === cat).length;
    byCategory[cat] = { total: inCat.length, unlocked: unlockedInCat };
  }
  return {
    totalAchievements: total,
    unlocked,
    completionRate: total > 0 ? Math.round((unlocked / total) * 100) / 100 : 0,
    byCategory,
  };
}

function computeMissionCompletion(userId: string, missions: ReturnType<typeof getPlayerMissions>): MissionCompletionData {
  const totalAssigned = missions.length;
  const completed = missions.filter(m => m.completed).length;
  const completionTimes = missions.filter(m => m.completed && m.completedAt && m.assignedAt)
    .map(m => new Date(m.completedAt!).getTime() - new Date(m.assignedAt).getTime());
  const avgCompletion = completionTimes.length > 0
    ? Math.round(completionTimes.reduce((s, t) => s + t, 0) / completionTimes.length)
    : 0;
  return {
    totalAssigned,
    completed,
    completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) / 100 : 0,
    averageCompletionTime: avgCompletion,
  };
}

function computeProgressVelocity(userId: string, xpEvents: ReturnType<typeof getXPEvents>, achievements: ReturnType<typeof getPlayerAchievements>): ProgressVelocityData {
  const now = Date.now();
  const dayAgo = now - 86_400_000;
  const weekAgo = now - 7 * 86_400_000;
  const xpDay = xpEvents.filter(e => new Date(e.timestamp).getTime() >= dayAgo).reduce((s, e) => s + e.amount, 0);
  const xpWeek = xpEvents.filter(e => new Date(e.timestamp).getTime() >= weekAgo).reduce((s, e) => s + e.amount, 0);
  const achievementsWeek = achievements.filter(a => new Date(a.unlockedAt).getTime() >= weekAgo).length;
  return {
    xpPerDay: xpDay,
    xpPerWeek: xpWeek,
    achievementsPerWeek: achievementsWeek,
    levelUpRate: 0, // Would need level-up events for precise calc
  };
}

function computeModePreference(userId: string, career: ReturnType<typeof getCareerStatistics>, history: ReturnType<typeof getMatchHistory>): ModePreferenceData {
  const modes: GameModeId[] = ["classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale"];
  const matchesByMode = {} as Record<GameModeId, number>;
  const xpByMode = {} as Record<GameModeId, number>;
  const winRateByMode = {} as Record<GameModeId, number>;
  for (const m of modes) {
    matchesByMode[m] = career?.perMode[m].matches ?? 0;
    xpByMode[m] = career?.perMode[m].totalXP ?? 0;
    winRateByMode[m] = career?.perMode[m].winRate ?? 0;
  }
  let preferredMode: GameModeId | null = null;
  let maxMatches = 0;
  for (const m of modes) {
    if (matchesByMode[m] > maxMatches) {
      maxMatches = matchesByMode[m];
      preferredMode = m;
    }
  }
  return { matchesByMode, xpByMode, winRateByMode, preferredMode };
}

// ===========================================================================
// System 21 — Import / Export
// ===========================================================================

export function exportProfile(userId: string): ProfileExport | null {
  const profile = getProfile(userId);
  if (!profile) return null;
  const career = getCareerStatistics(userId);
  const achievements = getPlayerAchievements(userId);
  const badges = getPlayerBadges(userId);
  const titles = getPlayerTitles(userId);
  const history = getMatchHistory(userId, 1000);
  const timeline = getCareerTimeline(userId, 1000);
  const seasons = listSeasons().map(s => ({
    seasonId: s.id,
    seasonNumber: s.seasonNumber,
    finalLevel: 0,
    finalXP: 0,
    finalRank: null,
    rewardsClaimed: 0,
    achievementsEarned: 0,
  }));

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    userId,
    profile,
    career: career ?? {
      userId,
      lifetime: { totalMatches: 0, totalWins: 0, totalLosses: 0, winRate: 0, totalQuestionsAnswered: 0, totalQuestionsCorrect: 0, accuracy: 0, totalXP: 0, totalPlaytimeMs: 0, longestWinStreak: 0, currentWinStreak: 0, achievementsUnlocked: 0, badgesEarned: 0, tournamentsPlayed: 0, tournamentsWon: 0 },
      perMode: {} as Record<GameModeId, any>,
      perSeason: {}, perOrganization: {}, perClassroom: {},
      perTournament: { played: 0, won: 0, finals: 0, semifinals: 0, bronze: 0 },
    },
    achievements,
    badges,
    titles,
    matchHistory: history,
    timeline,
    seasons,
  };
}

export function exportProfileJSON(userId: string): string | null {
  const data = exportProfile(userId);
  return data ? JSON.stringify(data, null, 2) : null;
}

export function exportProfileCSV(userId: string): string | null {
  const data = exportProfile(userId);
  if (!data) return null;
  // Flatten to CSV: profile summary + key metrics
  const rows: string[] = [];
  rows.push("Field,Value");
  rows.push(`userId,${data.userId}`);
  rows.push(`displayName,${data.profile.displayName}`);
  rows.push(`level,${data.profile.level}`);
  rows.push(`totalXP,${data.profile.totalXP}`);
  rows.push(`prestigeLevel,${data.profile.prestigeLevel}`);
  rows.push(`totalMatches,${data.career.lifetime.totalMatches}`);
  rows.push(`totalWins,${data.career.lifetime.totalWins}`);
  rows.push(`winRate,${data.career.lifetime.winRate}`);
  rows.push(`totalQuestionsAnswered,${data.career.lifetime.totalQuestionsAnswered}`);
  rows.push(`totalQuestionsCorrect,${data.career.lifetime.totalQuestionsCorrect}`);
  rows.push(`accuracy,${data.career.lifetime.accuracy}`);
  rows.push(`tournamentsPlayed,${data.career.lifetime.tournamentsPlayed}`);
  rows.push(`tournamentsWon,${data.career.lifetime.tournamentsWon}`);
  rows.push(`achievementsUnlocked,${data.achievements.length}`);
  rows.push(`badgesEarned,${data.badges.length}`);
  rows.push(`titlesUnlocked,${data.titles.length}`);
  rows.push(`matchesPlayed,${data.matchHistory.length}`);
  return rows.join("\n");
}

// ===========================================================================
// System 22 — Progression Dashboard (unified for player/teacher/org/platform)
// ===========================================================================

export function generateProgressionDashboard(input: {
  audience: DashboardAudience;
  userId?: string | null;
  organizationId?: string | null;
}): ProgressionDashboard {
  const { audience, userId = null, organizationId = null } = input;
  const allProfiles = Array.from(new Map<string, any>().entries()); // Would iterate over all profiles in production
  const metrics: ProgressionMetrics = {
    totalPlayers: 0,
    activePlayers: 0,
    totalXP: 0,
    averageLevel: 0,
    achievementsUnlocked: 0,
    missionsCompleted: 0,
    retentionRate: 0,
  };

  // For player audience, return player-specific dashboard
  if (audience === "player" && userId) {
    const profile = getProfile(userId);
    const career = getCareerStatistics(userId);
    const timeline = getCareerTimeline(userId, 10);
    if (profile && career) {
      metrics.totalPlayers = 1;
      metrics.activePlayers = 1;
      metrics.totalXP = profile.totalXP;
      metrics.averageLevel = profile.level;
      metrics.achievementsUnlocked = career.lifetime.achievementsUnlocked;
      metrics.missionsCompleted = career.lifetime.totalMatches;
    }
    return {
      audience,
      userId,
      organizationId: null,
      metrics,
      topPerformers: [{ userId, displayName: profile?.displayName ?? "", xp: profile?.totalXP ?? 0, level: profile?.level ?? 1 }],
      recentActivity: timeline,
      alerts: generateAlerts(userId),
    };
  }

  // For teacher / organization / platform audiences
  return {
    audience,
    userId,
    organizationId,
    metrics,
    topPerformers: [],
    recentActivity: [],
    alerts: [],
  };
}

function generateAlerts(userId: string | null): ProgressionAlert[] {
  if (!userId) return [];
  const alerts: ProgressionAlert[] = [];
  const profile = getProfile(userId);
  if (!profile) return alerts;

  // Milestone-near alert
  for (const m of profile.milestones) {
    if (!m.achieved && m.currentValue >= m.targetValue * 0.9) {
      alerts.push({
        id: randomUUID(),
        kind: "milestone_near",
        severity: "info",
        message: `Milestone "${m.milestoneId}" is ${Math.round((m.currentValue / m.targetValue) * 100)}% complete`,
        userId,
        metadata: { milestoneId: m.milestoneId, currentValue: m.currentValue, targetValue: m.targetValue },
      });
    }
  }

  // Season ending alert
  const activeSeason = getActiveSeason();
  if (activeSeason) {
    const daysLeft = Math.ceil((new Date(activeSeason.endDate).getTime() - Date.now()) / 86_400_000);
    if (daysLeft <= 7) {
      alerts.push({
        id: randomUUID(),
        kind: "season_ending",
        severity: daysLeft <= 2 ? "critical" : "warning",
        message: `Season "${activeSeason.name}" ends in ${daysLeft} day(s)`,
        userId,
        metadata: { seasonId: activeSeason.id, daysLeft },
      });
    }
  }

  // Mission expiring alert
  const missions = getPlayerMissions(userId);
  for (const m of missions) {
    if (m.completed) continue;
    const expires = new Date(m.expiresAt);
    const hoursLeft = Math.ceil((expires.getTime() - Date.now()) / 3_600_000);
    if (hoursLeft <= 6) {
      alerts.push({
        id: randomUUID(),
        kind: "mission_expiring",
        severity: hoursLeft <= 2 ? "critical" : "warning",
        message: `Mission "${m.missionId}" expires in ${hoursLeft}h`,
        userId,
        metadata: { missionId: m.missionId, hoursLeft },
      });
    }
  }

  return alerts;
}
