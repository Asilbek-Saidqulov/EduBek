/**
 * EduBek Live Quiz — Classic Quiz Game Mode.
 *
 * Standard competitive quiz. Correct answers + speed bonus. Highest score wins.
 *
 * Scoring:
 *   Correct answer:       500 base points
 *   Speed bonus:          0–3 sec → +500, 3–6 sec → +300, 6–10 sec → +100
 *   Wrong / no answer:    0 points
 *   Maximum per round:    1000 points
 *
 * Leaderboard ranks by total score. No eliminations.
 * Winner = highest score after all rounds.
 */
import type {
  AnswerInput,
  GameModeConfig,
  GameModeStrategy,
  LeaderboardEntry,
  PlayerModeState,
  RewardSpec,
  RoundContext,
  RoundResult,
} from "../types";

const BASE_POINTS = 500;
const SPEED_BONUS_TIERS = [
  { maxMs: 3_000, bonus: 500 },
  { maxMs: 6_000, bonus: 300 },
  { maxMs: 10_000, bonus: 100 },
];

function speedBonus(responseMs: number): number {
  for (const tier of SPEED_BONUS_TIERS) {
    if (responseMs <= tier.maxMs) return tier.bonus;
  }
  return 0;
}

export const classicMode: GameModeStrategy = {
  id: "classic",
  name: "Classic Quiz",
  description: "Standard competitive quiz. Correct answers + speed bonus. Highest score wins.",
  metadata: {
    difficulty: "easy",
    recommendedPlayers: 20,
    estimatedDurationSec: 600,
    displayNameKey: "gameModes.classic",
    descriptionKey: "landing.systems.quizPlatform.name",
    supportsTeams: false,
    supportsTournament: true,
    supportsSpectators: true,
    supportsReplay: true,
    shortDescription: "Standard competitive quiz with speed bonus",
    iconName: "trophy",
    themeColor: "#3b82f6",
  },

  createSession(_player, _config) {
    return { score: 0, modeState: {} };
  },

  startRound() {
    return {};
  },

  processAnswer(input, _player, _ctx, _config) {
    if (!input.isCorrect) {
      return {
        playerId: input.playerId,
        isCorrect: false,
        responseMs: input.responseMs,
        pointsAwarded: 0,
      };
    }
    const bonus = speedBonus(input.responseMs);
    return {
      playerId: input.playerId,
      isCorrect: true,
      responseMs: input.responseMs,
      pointsAwarded: BASE_POINTS + bonus,
    };
  },

  finishRound(_ctx, results, _players, _config) {
    const resultsSnapshot: Record<string, RoundResult> = {};
    for (const r of results) {
      resultsSnapshot[r.playerId] = r;
    }
    return { resultsSnapshot };
  },

  calculateScores(players, previousLeaderboard, _config) {
    const previousRank = new Map<string, number>();
    if (previousLeaderboard) {
      previousLeaderboard.forEach((e, i) => previousRank.set(e.playerId, i + 1));
    }
    const sorted = [...players].sort((a, b) => b.modeState.score - a.modeState.score);
    return sorted.map((p, i) => {
      const rank = i + 1;
      const prev = previousRank.get(p.playerId);
      const rankChange = prev != null ? prev - rank : 0;
      return {
        playerId: p.playerId,
        userId: p.userId,
        displayName: p.displayName,
        score: p.modeState.score,
        rank,
        accuracy: p.answeredCount > 0 ? p.correctCount / p.answeredCount : 0,
        avgResponseMs: p.answeredCount > 0 ? Math.round(p.totalResponseMs / p.answeredCount) : 0,
        streak: p.currentStreak,
        rankChange,
      } satisfies LeaderboardEntry;
    });
  },

  determineWinner(leaderboard, _players, _config) {
    if (leaderboard.length === 0) {
      return { winnerPlayerId: null, winnerUserId: null, finalists: [], reason: "no players" };
    }
    const top = leaderboard[0]!;
    const finalists = leaderboard.slice(0, 3).map((e) => e.playerId);
    return {
      winnerPlayerId: top.playerId,
      winnerUserId: top.userId,
      finalists,
      reason: "highest_score",
    };
  },

  applyRewards(leaderboard, winner, _config) {
    const rewards: RewardSpec[] = [];
    leaderboard.forEach((entry, i) => {
      // XP: position-based
      const xpBase = i === 0 ? 150 : i === 1 ? 100 : i === 2 ? 75 : 50;
      rewards.push({
        userId: entry.userId,
        rewardType: "xp",
        amount: xpBase,
        reason: `Finished rank ${i + 1} in Classic Quiz`,
      });
      // Coins: 20 for participation, 50 for top 3
      rewards.push({
        userId: entry.userId,
        rewardType: "coins",
        amount: i < 3 ? 50 : 20,
        reason: `Participation reward (rank ${i + 1})`,
      });
      // Season points
      rewards.push({
        userId: entry.userId,
        rewardType: "season_points",
        amount: i === 0 ? 10 : 5,
        reason: `Season points for rank ${i + 1}`,
      });
    });
    if (winner.userId) {
      rewards.push({
        userId: winner.userId,
        rewardType: "achievement",
        code: "classic_winner",
        reason: "Won a Classic Quiz match",
        metadata: { mode: "classic", score: leaderboard[0]?.score ?? 0 },
      });
    }
    leaderboard.forEach((entry) => {
      if (entry.streak >= 5) {
        rewards.push({
          userId: entry.userId,
          rewardType: "achievement",
          code: "streak_5",
          reason: "5-correct-answer streak in one session",
        });
      }
      if (entry.streak >= 10) {
        rewards.push({
          userId: entry.userId,
          rewardType: "achievement",
          code: "streak_10",
          reason: "10-correct-answer streak in one session",
        });
      }
    });
    return rewards;
  },

  finishGame(leaderboard, _config) {
    return {
      finalSnapshot: {
        mode: "classic",
        playerCount: leaderboard.length,
        topScore: leaderboard[0]?.score ?? 0,
        topPlayerId: leaderboard[0]?.playerId ?? null,
      },
    };
  },
};
