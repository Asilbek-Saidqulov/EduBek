/**
 * EduBek Live Quiz — Quiz Royale Game Mode.
 *
 * Survival mode. Wrong answers cost hearts. 5-correct streak = shield.
 * Last player standing wins.
 *
 * Mechanics:
 *   • Every player starts with 3 hearts
 *   • Wrong answer: lose 1 heart
 *   • Correct streak of 5: gain a shield (blocks one wrong answer)
 *   • When hearts reach 0: eliminated
 *   • Shield auto-consumes on the next wrong answer
 *   • Winner = last player surviving (or highest score if multiple survive)
 *
 * The engine drives round progression; this strategy only tracks hearts,
 * shields, and elimination status.
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

const STARTING_HEARTS = 3;
const SHIELD_STREAK_THRESHOLD = 5;

export interface RoyaleModeState {
  [key: string]: unknown;
  hearts: number;
  shields: number;
  correctStreak: number;
  eliminated: boolean;
  eliminatedRound?: number;
}

function getRoyaleState(state: PlayerModeState): RoyaleModeState {
  const s = state.modeState as unknown;
  if (typeof s === "object" && s !== null && "hearts" in s) {
    return s as RoyaleModeState;
  }
  return {
    hearts: STARTING_HEARTS,
    shields: 0,
    correctStreak: 0,
    eliminated: false,
  };
}

export const royaleMode: GameModeStrategy = {
  id: "royale",
  name: "Quiz Royale",
  description: "Survival mode. Wrong answers cost hearts. 5-correct streak = shield. Last player standing wins.",
  metadata: {
    difficulty: "medium",
    recommendedPlayers: 30,
    estimatedDurationSec: 800,
    supportsTeams: false,
    supportsTournament: false,
    supportsSpectators: true,
    supportsReplay: true,
    displayNameKey: "gameModes.royale",
    descriptionKey: "gameModes.royale",
    shortDescription: "Survival mode — last player standing wins",
    iconName: "heart",
    themeColor: "#ef4444",
  },

  createSession(_player, _config) {
    return {
      score: 0,
      modeState: {
        hearts: STARTING_HEARTS,
        shields: 0,
        correctStreak: 0,
        eliminated: false,
      } as RoyaleModeState,
    };
  },

  startRound(_ctx, players, _config) {
    // Skip eliminated players.
    return {
      roundMetadata: {
        aliveCount: players.filter((p) => !getRoyaleState(p.modeState).eliminated).length,
      },
    };
  },

  processAnswer(input, player, _ctx, _config) {
    const s = getRoyaleState(player.modeState);
    if (s.eliminated) {
      return {
        playerId: input.playerId,
        isCorrect: false,
        responseMs: input.responseMs,
        pointsAwarded: 0,
        outcome: "already_eliminated",
      };
    }
    if (input.isCorrect) {
      s.correctStreak += 1;
      // Award a shield every N correct in a row
      if (s.correctStreak > 0 && s.correctStreak % SHIELD_STREAK_THRESHOLD === 0) {
        s.shields += 1;
        // Score (for leaderboard tie-break): correct answers + shield bonuses
        player.modeState.score = (player.modeState.score ?? 0) + 100;
        return {
          playerId: input.playerId,
          isCorrect: true,
          responseMs: input.responseMs,
          pointsAwarded: 100,
          outcome: "shield_earned",
          delta: { shields: 1 },
        };
      }
      player.modeState.score = (player.modeState.score ?? 0) + 50;
      return {
        playerId: input.playerId,
        isCorrect: true,
        responseMs: input.responseMs,
        pointsAwarded: 50,
      };
    }
    // Wrong answer
    s.correctStreak = 0;
    if (s.shields > 0) {
      s.shields -= 1;
      return {
        playerId: input.playerId,
        isCorrect: false,
        responseMs: input.responseMs,
        pointsAwarded: 0,
        outcome: "shield_blocked",
        delta: { shields: -1 },
      };
    }
    s.hearts -= 1;
    if (s.hearts <= 0) {
      s.hearts = 0;
      s.eliminated = true;
      return {
        playerId: input.playerId,
        isCorrect: false,
        responseMs: input.responseMs,
        pointsAwarded: 0,
        outcome: "eliminated",
        delta: { hearts: -1 },
      };
    }
    return {
      playerId: input.playerId,
      isCorrect: false,
      responseMs: input.responseMs,
      pointsAwarded: 0,
      outcome: "lost_heart",
      delta: { hearts: -1 },
    };
  },

  finishRound(ctx, results, players, _config) {
    const resultsSnapshot: Record<string, RoundResult> = {};
    const eliminated: string[] = [];
    for (const r of results) {
      resultsSnapshot[r.playerId] = r;
      if (r.outcome === "eliminated") {
        eliminated.push(r.playerId);
      }
    }
    // Also handle players who didn't answer (treated as wrong, lose heart)
    for (const p of players) {
      const s = getRoyaleState(p.modeState);
      if (s.eliminated) continue;
      if (!resultsSnapshot[p.playerId]) {
        // No answer → wrong
        if (s.shields > 0) {
          s.shields -= 1;
          resultsSnapshot[p.playerId] = {
            playerId: p.playerId,
            isCorrect: false,
            responseMs: ctx.durationMs,
            pointsAwarded: 0,
            outcome: "shield_blocked_no_answer",
            delta: { shields: -1 },
          };
        } else {
          s.hearts -= 1;
          s.correctStreak = 0;
          if (s.hearts <= 0) {
            s.hearts = 0;
            s.eliminated = true;
            s.eliminatedRound = ctx.roundNumber;
            eliminated.push(p.playerId);
            resultsSnapshot[p.playerId] = {
              playerId: p.playerId,
              isCorrect: false,
              responseMs: ctx.durationMs,
              pointsAwarded: 0,
              outcome: "eliminated_no_answer",
              delta: { hearts: -1 },
            };
          } else {
            resultsSnapshot[p.playerId] = {
              playerId: p.playerId,
              isCorrect: false,
              responseMs: ctx.durationMs,
              pointsAwarded: 0,
              outcome: "lost_heart_no_answer",
              delta: { hearts: -1 },
            };
          }
        }
      }
    }
    return { resultsSnapshot, eliminated };
  },

  calculateScores(players, previousLeaderboard, _config) {
    const previousRank = new Map<string, number>();
    if (previousLeaderboard) {
      previousLeaderboard.forEach((e, i) => previousRank.set(e.playerId, i + 1));
    }
    // Sort: non-eliminated first by score, then eliminated by survival round (later = better)
    const sorted = [...players].sort((a, b) => {
      const as = getRoyaleState(a.modeState);
      const bs = getRoyaleState(b.modeState);
      if (as.eliminated !== bs.eliminated) return as.eliminated ? 1 : -1;
      if (!as.eliminated && !bs.eliminated) {
        return b.modeState.score - a.modeState.score;
      }
      // Both eliminated: later elimination round is better
      return (bs.eliminatedRound ?? 0) - (as.eliminatedRound ?? 0);
    });
    return sorted.map((p, i) => {
      const rank = i + 1;
      const prev = previousRank.get(p.playerId);
      const rankChange = prev != null ? prev - rank : 0;
      const s = getRoyareState(p.modeState);
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
        eliminated: s.eliminated,
        modeDisplay: {
          hearts: s.hearts,
          shields: s.shields,
          eliminatedRound: s.eliminatedRound,
        },
      } satisfies LeaderboardEntry;
    });
  },

  determineWinner(leaderboard, _players, _config) {
    const alive = leaderboard.filter((e) => !e.eliminated);
    if (alive.length === 1) {
      const w = alive[0]!;
      return {
        winnerPlayerId: w.playerId,
        winnerUserId: w.userId,
        finalists: leaderboard.slice(0, 3).map((e) => e.playerId),
        reason: "last_player_standing",
      };
    }
    if (alive.length > 1) {
      // Multiple survivors after all rounds — highest score wins
      const w = alive[0]!;
      return {
        winnerPlayerId: w.playerId,
        winnerUserId: w.userId,
        finalists: alive.slice(0, 3).map((e) => e.playerId),
        reason: "highest_score_among_survivors",
      };
    }
    // No survivors — pick the last-eliminated player
    if (leaderboard.length > 0) {
      const w = leaderboard[0]!;
      return {
        winnerPlayerId: w.playerId,
        winnerUserId: w.userId,
        finalists: leaderboard.slice(0, 3).map((e) => e.playerId),
        reason: "last_eliminated",
      };
    }
    return { winnerPlayerId: null, winnerUserId: null, finalists: [], reason: "no_players" };
  },

  applyRewards(leaderboard, winner, _config) {
    const rewards: RewardSpec[] = [];
    leaderboard.forEach((entry, i) => {
      const survived = !entry.eliminated;
      rewards.push({
        userId: entry.userId,
        rewardType: "xp",
        amount: survived ? 100 : 40 + Math.max(0, 60 - i * 15),
        reason: `Finished rank ${i + 1} in Quiz Royale${survived ? " (survived)" : ""}`,
      });
      rewards.push({
        userId: entry.userId,
        rewardType: "coins",
        amount: survived ? 80 : 25,
        reason: `Royale participation reward`,
      });
    });
    if (winner.userId) {
      rewards.push({
        userId: winner.userId,
        rewardType: "achievement",
        code: "royale_winner",
        reason: "Won a Quiz Royale match (last standing)",
      });
      rewards.push({
        userId: winner.userId,
        rewardType: "title",
        code: "the_survivor",
        reason: "Royale champion title",
      });
    }
    // Perfection achievement: never lost a heart (won + no eliminations ever)
    leaderboard.forEach((entry) => {
      const hearts = (entry.modeDisplay?.hearts as number | undefined) ?? 0;
      if (entry.rank === 1 && hearts === STARTING_HEARTS) {
        rewards.push({
          userId: entry.userId,
          rewardType: "achievement",
          code: "flawless_victory",
          reason: "Won Quiz Royale without losing a single heart",
        });
      }
    });
    return rewards;
  },

  finishGame(leaderboard, _config) {
    return {
      finalSnapshot: {
        mode: "royale",
        playerCount: leaderboard.length,
        survivors: leaderboard.filter((e) => !e.eliminated).length,
        winnerId: leaderboard[0]?.playerId ?? null,
      },
    };
  },
};

// Helper to avoid a typo in the calculateScores function above
function getRoyareState(state: PlayerModeState): RoyaleModeState {
  return getRoyaleState(state);
}
