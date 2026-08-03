/**
 * EduBek Live Quiz — Battle Royale Game Mode.
 *
 * 1v1 duel. 5 questions. Highest score advances. Ties broken by speed.
 *
 * Mechanics:
 *   • Each match is a duel between 2 players
 *   • 5 questions per duel
 *   • Both players answer the same questions
 *   • Scoring per question: 100 base + 100 speed bonus (0-3s) + 50 (3-6s)
 *   • Winner = highest total score after 5 questions
 *   • Ties broken by fastest average response time
 *   • The winner advances to the next bracket round
 *
 * This strategy operates on a 2-player Quiz Session. The tournament
 * module orchestrates the bracket; each match is one LiveSession using
 * this Game Mode.
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

const DUEL_QUESTIONS = 5;
const BASE_POINTS = 100;
const SPEED_BONUS_FAST = 100; // 0-3s
const SPEED_BONUS_MEDIUM = 50; // 3-6s

function speedBonus(responseMs: number): number {
  if (responseMs <= 3_000) return SPEED_BONUS_FAST;
  if (responseMs <= 6_000) return SPEED_BONUS_MEDIUM;
  return 0;
}

export const battleMode: GameModeStrategy = {
  id: "battle",
  name: "Battle Royale",
  description: "1v1 duel. 5 questions. Highest score advances. Ties broken by speed.",
  metadata: {
    difficulty: "hard",
    recommendedPlayers: 2,
    estimatedDurationSec: 180,
    supportsTeams: false,
    supportsTournament: true,
    supportsSpectators: true,
    supportsReplay: true,
    displayNameKey: "gameModes.battle",
    descriptionKey: "gameModes.battle",
    shortDescription: "1v1 duel — 5 questions, highest score advances",
    iconName: "swords",
    themeColor: "#9333ea",
  },

  createSession(_player, config) {
    // Override totalRounds to 5 for battle mode
    config.totalRounds = DUEL_QUESTIONS;
    return { score: 0, modeState: { roundsWon: 0 } };
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
    return {
      playerId: input.playerId,
      isCorrect: true,
      responseMs: input.responseMs,
      pointsAwarded: BASE_POINTS + speedBonus(input.responseMs),
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
    // Sort by score desc, then by avg response time asc (faster = better)
    const sorted = [...players].sort((a, b) => {
      if (b.modeState.score !== a.modeState.score) {
        return b.modeState.score - a.modeState.score;
      }
      const aAvg = a.answeredCount > 0 ? a.totalResponseMs / a.answeredCount : Infinity;
      const bAvg = b.answeredCount > 0 ? b.totalResponseMs / b.answeredCount : Infinity;
      return aAvg - bAvg;
    });
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
        modeDisplay: {
          roundsWon: (p.modeState.modeState as any).roundsWon ?? 0,
        },
      } satisfies LeaderboardEntry;
    });
  },

  determineWinner(leaderboard, _players, _config) {
    if (leaderboard.length < 2) {
      const w = leaderboard[0] ?? null;
      return {
        winnerPlayerId: w?.playerId ?? null,
        winnerUserId: w?.userId ?? null,
        finalists: leaderboard.map((e) => e.playerId),
        reason: w ? "forfeit_win" : "no_players",
      };
    }
    const top = leaderboard[0]!;
    const second = leaderboard[1]!;
    // Tie already broken in calculateScores by response time
    const tieBroken = top.score === second.score;
    return {
      winnerPlayerId: top.playerId,
      winnerUserId: top.userId,
      finalists: [top.playerId, second.playerId],
      reason: tieBroken ? "speed_tiebreak" : "highest_score",
    };
  },

  applyRewards(leaderboard, winner, _config) {
    const rewards: RewardSpec[] = [];
    leaderboard.forEach((entry, i) => {
      const isWinner = i === 0;
      rewards.push({
        userId: entry.userId,
        rewardType: "xp",
        amount: isWinner ? 120 : 50,
        reason: isWinner ? "Won a Battle Royale duel" : "Lost a Battle Royale duel",
      });
      rewards.push({
        userId: entry.userId,
        rewardType: "coins",
        amount: isWinner ? 60 : 15,
        reason: "Battle participation",
      });
      if (isWinner) {
        rewards.push({
          userId: entry.userId,
          rewardType: "season_points",
          amount: 8,
          reason: "Battle win",
        });
      }
    });
    if (winner.userId) {
      rewards.push({
        userId: winner.userId,
        rewardType: "achievement",
        code: "duel_winner",
        reason: "Won a Battle Royale duel",
      });
      // Flawless: didn't get any question wrong
      const winnerEntry = leaderboard[0]!;
      if (winnerEntry.accuracy === 1) {
        rewards.push({
          userId: winner.userId,
          rewardType: "achievement",
          code: "flawless_duel",
          reason: "Won a Battle Royale duel with 100% accuracy",
        });
      }
    }
    return rewards;
  },

  finishGame(leaderboard, _config) {
    return {
      finalSnapshot: {
        mode: "battle",
        playerCount: leaderboard.length,
        winnerId: leaderboard[0]?.playerId ?? null,
        winnerScore: leaderboard[0]?.score ?? 0,
      },
    };
  },
};
