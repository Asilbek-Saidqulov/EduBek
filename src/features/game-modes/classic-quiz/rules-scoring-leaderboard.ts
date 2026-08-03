/**
 * Classic Quiz — Rules + Scoring + Leaderboards + Achievements + Streaks.
 * Pure configuration layer. No engine duplication.
 */
import { getLogger } from "@/lib/logger";
import type { ClassicQuizRules, ScoreInput, ScoreResult, LeaderboardEntry, LeaderboardType, StreakState, StreakMilestone, Achievement } from "./types";

const log = getLogger("classic-quiz");

// ===========================================================================
// System 1 — Rules
// ===========================================================================

export const CLASSIC_QUIZ_RULES: ClassicQuizRules = {
  gameMode: "classic_quiz",
  minPlayers: 2, maxPlayers: 10000,
  allowSpectators: true, allowLateJoin: true,
  reconnectPolicy: "allow",
  roundCount: 3, questionsPerRound: 5,
  timePerQuestionMs: 30_000, overtimeDisabled: true,
  hostControls: ["pause_match", "resume_match", "skip_question", "restart_question", "extend_timer", "reduce_timer", "lock_answers", "unlock_answers", "kick_player", "mute_chat", "freeze_lobby", "end_match", "emergency_stop"],
  organizationRestricted: false,
};

export function getRules(): ClassicQuizRules { return { ...CLASSIC_QUIZ_RULES }; }
export function validateRules(rules: Partial<ClassicQuizRules>): string[] {
  const errors: string[] = [];
  if (rules.minPlayers !== undefined && rules.minPlayers < 2) errors.push("minPlayers must be >= 2");
  if (rules.maxPlayers !== undefined && rules.maxPlayers > 10000) errors.push("maxPlayers must be <= 10000");
  if (rules.roundCount !== undefined && rules.roundCount < 1) errors.push("roundCount must be >= 1");
  if (rules.questionsPerRound !== undefined && rules.questionsPerRound < 1) errors.push("questionsPerRound must be >= 1");
  if (rules.timePerQuestionMs !== undefined && rules.timePerQuestionMs < 5000) errors.push("timePerQuestionMs must be >= 5000");
  return errors;
}

// ===========================================================================
// System 3 — Scoring Engine
// ===========================================================================

export const SCORING_CONFIG = {
  baseScore: 500,
  speedTiers: [
    { maxMs: 3000, bonus: 500, tier: "perfect" as const },
    { maxMs: 6000, bonus: 300, tier: "great" as const },
    { maxMs: 10000, bonus: 100, tier: "good" as const },
    { maxMs: Infinity, bonus: 0, tier: "ok" as const },
  ],
  wrongScore: 0, maxScore: 1000,
};

export function calculateScore(input: ScoreInput): ScoreResult {
  if (!input.isCorrect) return { baseScore: 0, speedBonus: 0, totalScore: 0, tier: "wrong" };
  const tier = SCORING_CONFIG.speedTiers.find(t => input.responseTimeMs <= t.maxMs)!;
  const total = Math.min(SCORING_CONFIG.maxScore, SCORING_CONFIG.baseScore + tier.bonus);
  return { baseScore: SCORING_CONFIG.baseScore, speedBonus: tier.bonus, totalScore: total, tier: tier.tier };
}

export function calculateScoreWithPlugin(input: ScoreInput, plugin?: (base: number, bonus: number) => number): ScoreResult {
  const result = calculateScore(input);
  if (plugin && result.totalScore > 0) result.totalScore = plugin(result.baseScore, result.speedBonus);
  return result;
}

// ===========================================================================
// System 4 — Combo & Streak
// ===========================================================================

export const STREAK_MILESTONES: StreakMilestone[] = [
  { id: "streak_3", name: "3 Correct", threshold: 3, bonus: 50, achieved: false },
  { id: "streak_5", name: "5 Correct", threshold: 5, bonus: 100, achieved: false },
  { id: "streak_10", name: "10 Correct", threshold: 10, bonus: 250, achieved: false },
  { id: "perfect_round", name: "Perfect Round", threshold: 999, bonus: 500, achieved: false },
];

export function createStreakState(): StreakState {
  return { currentStreak: 0, longestStreak: 0, comboBonus: 0, perfectRound: false };
}

export function updateStreak(state: StreakState, isCorrect: boolean, questionsInRound: number, currentQuestionInRound: number): StreakState {
  if (isCorrect) {
    state.currentStreak++;
    state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    // Check milestone bonuses
    for (const m of STREAK_MILESTONES) {
      if (state.currentStreak === m.threshold) state.comboBonus += m.bonus;
    }
    if (currentQuestionInRound === questionsInRound && state.currentStreak >= questionsInRound) {
      state.perfectRound = true;
      state.comboBonus += STREAK_MILESTONES[3].bonus;
    }
  } else {
    state.currentStreak = 0;
    state.perfectRound = false;
  }
  return state;
}

export function checkStreakMilestones(state: StreakState): StreakMilestone[] {
  return STREAK_MILESTONES.map(m => ({
    ...m,
    achieved: m.id === "perfect_round" ? state.perfectRound : state.longestStreak >= m.threshold,
  }));
}

// ===========================================================================
// System 5 — Leaderboards
// ===========================================================================

export function buildLeaderboard(players: Array<{
  userId: string; displayName: string; score: number;
  correctAnswers: number; totalAnswered: number;
  avgResponseMs: number; longestStreak: number; combo: number;
}>, type: LeaderboardType = "current_score"): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = players.map(p => ({
    rank: 0, userId: p.userId, displayName: p.displayName, score: p.score,
    accuracy: p.totalAnswered > 0 ? Math.round((p.correctAnswers / p.totalAnswered) * 100) / 100 : 0,
    avgResponseMs: p.avgResponseMs, longestStreak: p.longestStreak,
    correctAnswers: p.correctAnswers, combo: p.combo,
  }));
  const sortFn: Record<LeaderboardType, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
    current_score: (a, b) => b.score - a.score,
    accuracy: (a, b) => b.accuracy - a.accuracy,
    average_response: (a, b) => a.avgResponseMs - b.avgResponseMs,
    fastest_player: (a, b) => a.avgResponseMs - b.avgResponseMs,
    longest_streak: (a, b) => b.longestStreak - a.longestStreak,
    correct_answers: (a, b) => b.correctAnswers - a.correctAnswers,
    combo: (a, b) => b.combo - a.combo,
    teacher_view: (a, b) => b.score - a.score,
    final_ranking: (a, b) => b.score - a.score,
  };
  entries.sort(sortFn[type] ?? sortFn.current_score);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

// ===========================================================================
// System 10 — Achievements
// ===========================================================================

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_correct", name: "First Correct", description: "Answer your first question correctly", condition: (s) => s.correctCount >= 1, xpReward: 10 },
  { id: "five_correct", name: "5 Correct", description: "Answer 5 questions correctly", condition: (s) => s.correctCount >= 5, xpReward: 25 },
  { id: "ten_correct", name: "10 Correct", description: "Answer 10 questions correctly", condition: (s) => s.correctCount >= 10, xpReward: 50 },
  { id: "perfect_round", name: "Perfect Round", description: "Get every question in a round correct", condition: (s) => s.perfectRound, xpReward: 100 },
  { id: "speed_master", name: "Speed Master", description: "Answer in under 3 seconds", condition: (s) => s.fastestMs > 0 && s.fastestMs <= 3000, xpReward: 75 },
  { id: "lightning", name: "Lightning", description: "Answer in under 1 second", condition: (s) => s.fastestMs > 0 && s.fastestMs <= 1000, xpReward: 150 },
  { id: "accuracy_100", name: "Accuracy 100%", description: "100% accuracy in a match", condition: (s) => s.totalAnswered > 0 && s.correctCount === s.totalAnswered, xpReward: 100 },
  { id: "no_wrong", name: "No Wrong Answers", description: "Complete a match with zero wrong answers", condition: (s) => s.totalAnswered > 0 && s.correctCount === s.totalAnswered, xpReward: 75 },
  { id: "quick_thinker", name: "Quick Thinker", description: "Average response under 5 seconds", condition: (s) => s.fastestMs > 0 && s.fastestMs <= 5000, xpReward: 50 },
  { id: "top_3", name: "Top 3", description: "Finish in the top 3", condition: (s) => s.rank > 0 && s.rank <= 3, xpReward: 50 },
  { id: "champion", name: "Champion", description: "Win the match (rank 1)", condition: (s) => s.rank === 1, xpReward: 200 },
];

export function checkAchievements(stats: { correctCount: number; totalAnswered: number; fastestMs: number; longestStreak: number; rank: number; perfectRound: boolean }): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.condition(stats));
}

export function calculateXP(achievements: Achievement[]): number {
  return achievements.reduce((sum, a) => sum + a.xpReward, 0);
}
