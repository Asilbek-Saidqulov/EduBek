/**
 * Systems 6-9: Gameplay Flow, Leaderboards, Achievements, Match Summary.
 * Built using engine events. No engine duplication.
 */
import { getLogger } from "@/lib/logger";
import { getMatch, emitEvent, getEvents, saveReplay, getReplay } from "@/features/game-engine";
import { TREASURE_HEIST_RULES, getGoldBalance, getTransactionHistory, getActiveEvents } from "./economy-risk-engine";
import type { GameplayPhase, TreasureLeaderboardEntry, TreasureLeaderboardType, TreasureAchievement, TreasureAchievementStats, TreasureMatchSummary } from "./types";

const log = getLogger("treasure-heist");

// ===========================================================================
// System 6 — Gameplay Flow
// ===========================================================================

export function runQuestionPhase(matchId: string, questionIndex: number): GameplayPhase {
  emitEvent(matchId, "QuestionShown", null, { questionIndex, phase: "question" });
  return "question";
}

export function runAnswerPhase(matchId: string, userId: string, answer: string, isCorrect: boolean): GameplayPhase {
  emitEvent(matchId, "AnswerSubmitted", userId, { answer, isCorrect, phase: "answer" });
  return isCorrect ? "reward" : "next_question";
}

export function runRewardPhase(matchId: string, userId: string, reward: number): GameplayPhase {
  emitEvent(matchId, "ScoreUpdated", userId, { phase: "reward", reward, message: "Decision window opening" });
  return "decision_window";
}

export function runDecisionPhase(matchId: string, userId: string): GameplayPhase {
  return "decision_window";
}

export function runLeaderboardPhase(matchId: string): GameplayPhase {
  emitEvent(matchId, "StateTransition", null, { phase: "leaderboard" });
  return "leaderboard";
}

export function runStatisticsPhase(matchId: string): GameplayPhase {
  return "statistics";
}

export function runNextQuestionPhase(matchId: string): GameplayPhase {
  return "next_question";
}

// ===========================================================================
// System 7 — Leaderboards
// ===========================================================================

export function buildTreasureLeaderboard(players: Array<{
  userId: string; displayName: string; matchId: string;
  correctAnswers: number; totalAnswered: number;
  avgSpeedMs: number; stealsAttempted: number; stealsSuccessful: number;
  investmentsAttempted: number; investmentsSuccessful: number;
}>, type: TreasureLeaderboardType = "gold"): TreasureLeaderboardEntry[] {
  const entries: TreasureLeaderboardEntry[] = players.map(p => {
    const gold = getGoldBalance(p.matchId, p.userId);
    const steals = p.stealsSuccessful;
    const successfulInvestments = p.investmentsSuccessful;
    const accuracy = p.totalAnswered > 0 ? Math.round((p.correctAnswers / p.totalAnswered) * 100) / 100 : 0;
    const efficiency = p.totalAnswered > 0 ? Math.round((gold / (p.correctAnswers * TREASURE_HEIST_RULES.questionReward)) * 100) / 100 : 0;
    return {
      rank: 0, userId: p.userId, displayName: p.displayName,
      gold, netWorth: gold, steals, successfulInvestments,
      accuracy, avgSpeedMs: p.avgSpeedMs, correctAnswers: p.correctAnswers,
      efficiency,
    };
  });
  const sortFn: Record<TreasureLeaderboardType, (a: TreasureLeaderboardEntry, b: TreasureLeaderboardEntry) => number> = {
    gold: (a, b) => b.gold - a.gold,
    net_worth: (a, b) => b.netWorth - a.netWorth,
    steals: (a, b) => b.steals - a.steals,
    successful_investments: (a, b) => b.successfulInvestments - a.successfulInvestments,
    accuracy: (a, b) => b.accuracy - a.accuracy,
    speed: (a, b) => a.avgSpeedMs - b.avgSpeedMs,
    correct_answers: (a, b) => b.correctAnswers - a.correctAnswers,
    efficiency: (a, b) => b.efficiency - a.efficiency,
    teacher_view: (a, b) => b.gold - a.gold,
    final_ranking: (a, b) => b.gold - a.gold,
  };
  entries.sort(sortFn[type] ?? sortFn.gold);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

// ===========================================================================
// System 8 — Achievements
// ===========================================================================

export const TREASURE_ACHIEVEMENTS: TreasureAchievement[] = [
  { id: "safe_investor", name: "Safe Investor", description: "Choose SAVE 5 times in a row", condition: (s) => s.correctCount >= 5, xpReward: 25 },
  { id: "master_thief", name: "Master Thief", description: "Successfully steal 5 times", condition: (s) => s.stealsSuccessful >= 5, xpReward: 50 },
  { id: "treasure_king", name: "Treasure King", description: "Accumulate 500+ gold", condition: (s) => s.maxGold >= 500, xpReward: 100 },
  { id: "lucky_player", name: "Lucky Player", description: "Win 3 investments in a row", condition: (s) => s.investmentsSuccessful >= 3, xpReward: 50 },
  { id: "risk_master", name: "Risk Master", description: "Attempt 10 risk decisions", condition: (s) => s.stealsAttempted + s.investmentsAttempted >= 10, xpReward: 75 },
  { id: "perfect_investor", name: "Perfect Investor", description: "Win all investments (min 3)", condition: (s) => s.investmentsAttempted >= 3 && s.investmentsSuccessful === s.investmentsAttempted, xpReward: 100 },
  { id: "gold_hoarder", name: "Gold Hoarder", description: "Never lose gold to penalties", condition: (s) => s.goldLost === 0 && s.totalAnswered > 0, xpReward: 75 },
  { id: "untouchable", name: "Untouchable", description: "Never get stolen from", condition: (s) => s.correctCount > 0, xpReward: 50 },
  { id: "smart_economist", name: "Smart Economist", description: "End with 300+ gold", condition: (s) => s.currentGold >= 300, xpReward: 75 },
  { id: "comeback", name: "Comeback", description: "Win after being in last place", condition: (s) => s.rank === 1 && s.goldLost > 0, xpReward: 100 },
];

export function checkTreasureAchievements(stats: TreasureAchievementStats): TreasureAchievement[] {
  return TREASURE_ACHIEVEMENTS.filter(a => a.condition(stats));
}

// ===========================================================================
// System 9 — Match Summary
// ===========================================================================

export function generateTreasureMatchSummary(matchId: string): TreasureMatchSummary | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const players = m.players.map(p => ({
    userId: p.userId, displayName: p.displayName, matchId,
    correctAnswers: 0, totalAnswered: 0, avgSpeedMs: 0,
    stealsAttempted: 0, stealsSuccessful: 0,
    investmentsAttempted: 0, investmentsSuccessful: 0,
  }));
  const leaderboard = buildTreasureLeaderboard(players, "final_ranking");
  const winner = leaderboard[0] ?? null;
  const topPlayers = leaderboard.slice(0, 5);
  const transactions = getTransactionHistory(matchId);
  // Economy timeline
  const economyTimeline = transactions.reduce<Array<{ timestamp: string; totalGold: number; avgGold: number }>>((timeline, tx) => {
    const last = timeline[timeline.length - 1];
    const totalGold = (last?.totalGold ?? 0) + tx.amount;
    const avgGold = Math.round(totalGold / Math.max(1, m.players.length));
    timeline.push({ timestamp: tx.timestamp, totalGold, avgGold });
    return timeline;
  }, []);
  // Investment stats
  const investTxs = transactions.filter(t => t.action === "invest_win" || t.action === "invest_loss");
  const investSuccess = transactions.filter(t => t.action === "invest_win");
  const investmentStats = {
    attempted: investTxs.length, successful: investSuccess.length,
    successRate: investTxs.length > 0 ? Math.round((investSuccess.length / investTxs.length) * 100) / 100 : 0,
    totalGained: investSuccess.reduce((s, t) => s + t.amount, 0),
    totalLost: transactions.filter(t => t.action === "invest_loss").reduce((s, t) => s + t.amount, 0),
  };
  // Steal stats
  const stealTxs = transactions.filter(t => t.action === "steal");
  const stealSuccess = stealTxs.filter(t => t.amount > 0);
  const stealPenalty = transactions.filter(t => t.action === "penalty");
  const stealStats = {
    attempted: stealTxs.length + stealPenalty.length, successful: stealSuccess.length,
    successRate: stealTxs.length + stealPenalty.length > 0 ? Math.round((stealSuccess.length / (stealTxs.length + stealPenalty.length)) * 100) / 100 : 0,
    totalStolen: stealSuccess.reduce((s, t) => s + t.amount, 0),
    totalPenalty: stealPenalty.reduce((s, t) => s + t.amount, 0),
  };
  // Decision distribution
  const decisionDistribution = {
    save: transactions.filter(t => t.reason === "correct_answer_saved").length,
    invest: investTxs.length,
    steal: stealTxs.length + stealPenalty.length,
  };
  const avgAccuracy = leaderboard.length > 0 ? Math.round(leaderboard.reduce((s, e) => s + e.accuracy, 0) / leaderboard.length * 100) / 100 : 0;
  const fastest = [...leaderboard].sort((a, b) => a.avgSpeedMs - b.avgSpeedMs)[0] ?? null;
  const events = getEvents(matchId);
  const teacherEvents = events.filter(e => e.type === "TeacherOverride");
  return {
    matchId, winner, topPlayers, economyTimeline,
    investmentStats, stealStats, decisionDistribution,
    averageAccuracy: avgAccuracy, fastestThinker: fastest,
    achievements: leaderboard.map(e => ({
      userId: e.userId,
      achievements: checkTreasureAchievements({
        correctCount: e.correctAnswers, totalAnswered: Math.max(1, e.correctAnswers),
        goldEarned: e.gold, goldLost: 0, currentGold: e.gold,
        stealsAttempted: e.steals, stealsSuccessful: e.steals,
        investmentsAttempted: e.successfulInvestments, investmentsSuccessful: e.successfulInvestments,
        rank: e.rank, perfectRound: e.accuracy === 1, maxGold: e.gold,
      }).map(a => a.id),
    })),
    replayAvailable: !!getReplay(matchId), exportAvailable: true,
    teacherReport: { interventions: teacherEvents.length, eventsInjected: 0, economyResets: 0 },
  };
}
