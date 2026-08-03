/**
 * EduBek Live Quiz — Treasure Heist Game Mode.
 *
 * Collect gold. Save, invest, or steal. Highest gold wins.
 *
 * Mechanics:
 *   • Correct answer:        +100 gold
 *   • After each round, the player chooses an action for the next round:
 *       - save     → guaranteed (no change)
 *       - invest   → 50% double / 50% lose all gains from this round
 *       - steal    → attempt to steal from another player:
 *                       success: +300, failure: -100
 *
 * Steal resolution: random 50% success. The target is chosen randomly
 * from players above the stealer on the leaderboard (or any player if
 * the stealer is at the top).
 *
 * Winner = highest gold at Quiz Session end.
 *
 * The action choice is stored in player.modeState.nextAction. The engine
 * reads it at startRound and clears it after resolution.
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

const GOLD_PER_CORRECT = 100;
const INVEST_DOUBLE_CHANCE = 0.5;
const STEAL_SUCCESS_CHANCE = 0.5;
const STEAL_SUCCESS_AMOUNT = 300;
const STEAL_FAILURE_PENALTY = 100;

export interface TreasureModeState {
  [key: string]: unknown;
  gold: number;
  nextAction?: "save" | "invest" | "steal";
  stealTargetId?: string;
  investOutcome?: "doubled" | "lost" | "none";
  stealOutcome?: "success" | "failure" | "none";
}

function getTreasureState(state: PlayerModeState): TreasureModeState {
  const s = state.modeState as unknown;
  if (typeof s === "object" && s !== null && "gold" in s) {
    return s as TreasureModeState;
  }
  return { gold: 0 };
}

export const treasureMode: GameModeStrategy = {
  id: "treasure",
  name: "Treasure Heist",
  description: "Collect gold. Save, invest, or steal. Highest gold wins.",
  metadata: {
    difficulty: "medium",
    recommendedPlayers: 15,
    estimatedDurationSec: 720,
    supportsTeams: false,
    supportsTournament: true,
    supportsSpectators: true,
    supportsReplay: true,
    displayNameKey: "gameModes.treasure",
    descriptionKey: "gameModes.treasure",
    shortDescription: "Collect gold via save/invest/steal decisions",
    iconName: "coins",
    themeColor: "#eab308",
  },

  createSession(_player, _config) {
    return {
      score: 0,
      modeState: { gold: 0 } as TreasureModeState,
    };
  },

  startRound(_ctx, players, _config) {
    // Resolve pending invest/steal actions from the previous round.
    for (const p of players) {
      const s = getTreasureState(p.modeState);
      if (s.nextAction === "invest") {
        // Invest outcome applies to the gold earned in the previous round.
        const lastRoundGold = (p.modeState.modeState as any).__lastRoundGold ?? 0;
        if (Math.random() < INVEST_DOUBLE_CHANCE) {
          s.gold += lastRoundGold; // double
          s.investOutcome = "doubled";
        } else {
          s.gold = Math.max(0, s.gold - lastRoundGold); // lose
          s.investOutcome = "lost";
        }
      } else if (s.nextAction === "steal") {
        // Resolve steal against target
        const target = players.find((x) => x.playerId === s.stealTargetId);
        if (target) {
          const targetState = getTreasureState(target.modeState);
          if (Math.random() < STEAL_SUCCESS_CHANCE) {
            const stolen = Math.min(STEAL_SUCCESS_AMOUNT, targetState.gold);
            s.gold += stolen;
            targetState.gold -= stolen;
            s.stealOutcome = "success";
          } else {
            s.gold = Math.max(0, s.gold - STEAL_FAILURE_PENALTY);
            s.stealOutcome = "failure";
          }
        }
      }
      // Clear the pending action
      s.nextAction = undefined;
      s.stealTargetId = undefined;
      (p.modeState.modeState as any).__lastRoundGold = 0;
    }
    return {
      roundMetadata: { phase: "answering" },
    };
  },

  processAnswer(input, player, _ctx, _config) {
    const s = getTreasureState(player.modeState);
    if (input.isCorrect) {
      s.gold += GOLD_PER_CORRECT;
      (player.modeState.modeState as any).__lastRoundGold = GOLD_PER_CORRECT;
      // Score (for the generic leaderboard) = gold
      player.modeState.score = s.gold;
      return {
        playerId: input.playerId,
        isCorrect: true,
        responseMs: input.responseMs,
        pointsAwarded: GOLD_PER_CORRECT,
        delta: { gold: GOLD_PER_CORRECT },
      };
    }
    return {
      playerId: input.playerId,
      isCorrect: false,
      responseMs: input.responseMs,
      pointsAwarded: 0,
    };
  },

  finishRound(_ctx, results, players, _config) {
    const resultsSnapshot: Record<string, RoundResult> = {};
    for (const r of results) {
      resultsSnapshot[r.playerId] = r;
    }
    return {
      resultsSnapshot,
      roundMetadata: {
        phase: "action_selection",
        // Tell the client to render the save/invest/steal choice UI.
        availableActions: ["save", "invest", "steal"],
      },
    };
  },

  calculateScores(players, previousLeaderboard, _config) {
    const previousRank = new Map<string, number>();
    if (previousLeaderboard) {
      previousLeaderboard.forEach((e, i) => previousRank.set(e.playerId, i + 1));
    }
    const sorted = [...players].sort((a, b) => {
      const ag = getTreasureState(a.modeState).gold;
      const bg = getTreasureState(b.modeState).gold;
      return bg - ag;
    });
    return sorted.map((p, i) => {
      const rank = i + 1;
      const prev = previousRank.get(p.playerId);
      const rankChange = prev != null ? prev - rank : 0;
      const s = getTreasureState(p.modeState);
      return {
        playerId: p.playerId,
        userId: p.userId,
        displayName: p.displayName,
        score: s.gold,
        rank,
        accuracy: p.answeredCount > 0 ? p.correctCount / p.answeredCount : 0,
        avgResponseMs: p.answeredCount > 0 ? Math.round(p.totalResponseMs / p.answeredCount) : 0,
        streak: p.currentStreak,
        rankChange,
        modeDisplay: {
          gold: s.gold,
          investOutcome: s.investOutcome,
          stealOutcome: s.stealOutcome,
        },
      } satisfies LeaderboardEntry;
    });
  },

  determineWinner(leaderboard, _players, _config) {
    if (leaderboard.length === 0) {
      return { winnerPlayerId: null, winnerUserId: null, finalists: [], reason: "no players" };
    }
    const top = leaderboard[0]!;
    return {
      winnerPlayerId: top.playerId,
      winnerUserId: top.userId,
      finalists: leaderboard.slice(0, 3).map((e) => e.playerId),
      reason: "highest_gold",
    };
  },

  applyRewards(leaderboard, winner, _config) {
    const rewards: RewardSpec[] = [];
    leaderboard.forEach((entry, i) => {
      rewards.push({
        userId: entry.userId,
        rewardType: "xp",
        amount: 50 + Math.max(0, 100 - i * 20),
        reason: `Finished rank ${i + 1} in Treasure Heist`,
      });
      // Convert in-game gold to wallet coins at a 1:1 rate (capped at 500)
      const goldEarned = (entry.modeDisplay?.gold as number | undefined) ?? 0;
      const coinsEarned = Math.min(500, Math.floor(goldEarned));
      rewards.push({
        userId: entry.userId,
        rewardType: "coins",
        amount: coinsEarned,
        reason: `Treasure mode gold conversion`,
      });
    });
    if (winner.userId) {
      rewards.push({
        userId: winner.userId,
        rewardType: "achievement",
        code: "treasure_winner",
        reason: "Won a Treasure Heist match",
      });
    }
    return rewards;
  },

  finishGame(leaderboard, _config) {
    return {
      finalSnapshot: {
        mode: "treasure",
        playerCount: leaderboard.length,
        topGold: leaderboard[0]?.score ?? 0,
        topPlayerId: leaderboard[0]?.playerId ?? null,
      },
    };
  },
};
