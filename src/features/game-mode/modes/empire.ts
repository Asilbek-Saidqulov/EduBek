/**
 * EduBek Live Quiz — Empire Builder Game Mode.
 *
 * Build a civilization. Correct answers generate resources. Random events.
 * Highest Empire Power wins.
 *
 * Mechanics:
 *   • Correct answers generate resources: wood, stone, food, gold
 *   • Resources depend on question topic / random distribution
 *   • Buildings (in order): Camp → Village → Town → City → Empire
 *   • Each building costs resources but boosts production
 *   • Random events fire after each round:
 *       - Trade Caravan: +50 of each resource
 *       - Golden Age:    +200 gold
 *       - Tax Bonus:     +100 gold
 *       - Earthquake:    -25% stone
 *       - Harvest Festival: +50% food
 *
 * Empire Power = sum of (building levels × 100) + gold/10
 *
 * Winner = highest Empire Power at Quiz Session end.
 *
 * Building costs (cumulative):
 *   Camp:     50 wood, 20 stone
 *   Village:  100 wood, 50 stone, 50 food
 *   Town:     150 wood, 100 stone, 100 food, 50 gold
 *   City:     200 wood, 150 stone, 150 food, 100 gold
 *   Empire:   300 wood, 200 stone, 200 food, 200 gold
 *
 * Building production boost per level: +20% resource generation
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

const BUILDING_LEVELS = ["none", "camp", "village", "town", "city", "empire"] as const;
const BUILDING_COSTS: Record<number, { wood: number; stone: number; food: number; gold: number }> = {
  1: { wood: 50, stone: 20, food: 0, gold: 0 },
  2: { wood: 100, stone: 50, food: 50, gold: 0 },
  3: { wood: 150, stone: 100, food: 100, gold: 50 },
  4: { wood: 200, stone: 150, food: 150, gold: 100 },
  5: { wood: 300, stone: 200, food: 200, gold: 200 },
};

const RANDOM_EVENTS = [
  { id: "trade_caravan", weight: 20, apply: (s: EmpireModeState) => { s.wood += 50; s.stone += 50; s.food += 50; s.gold += 50; } },
  { id: "golden_age", weight: 10, apply: (s: EmpireModeState) => { s.gold += 200; } },
  { id: "tax_bonus", weight: 15, apply: (s: EmpireModeState) => { s.gold += 100; } },
  { id: "earthquake", weight: 10, apply: (s: EmpireModeState) => { s.stone = Math.floor(s.stone * 0.75); } },
  { id: "harvest_festival", weight: 15, apply: (s: EmpireModeState) => { s.food = Math.floor(s.food * 1.5); } },
  { id: "none", weight: 30, apply: () => {} },
] as const;

export interface EmpireModeState {
  [key: string]: unknown;
  wood: number;
  stone: number;
  food: number;
  gold: number;
  buildingLevel: number; // 0-5
  lastEvent?: string;
}

function getEmpireState(state: PlayerModeState): EmpireModeState {
  const s = state.modeState as unknown;
  if (typeof s === "object" && s !== null && "wood" in s) {
    return s as EmpireModeState;
  }
  return { wood: 0, stone: 0, food: 0, gold: 0, buildingLevel: 0 };
}

function productionMultiplier(level: number): number {
  return 1 + level * 0.2;
}

function rollEvent(): { id: string; apply: (s: EmpireModeState) => void } {
  const totalWeight = RANDOM_EVENTS.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const e of RANDOM_EVENTS) {
    if (roll < e.weight) return e;
    roll -= e.weight;
  }
  return RANDOM_EVENTS[RANDOM_EVENTS.length - 1]!;
}

function computeEmpirePower(s: EmpireModeState): number {
  return s.buildingLevel * 100 + Math.floor(s.gold / 10);
}

function tryUpgradeBuilding(s: EmpireModeState): boolean {
  const nextLevel = s.buildingLevel + 1;
  if (nextLevel > 5) return false;
  const cost = BUILDING_COSTS[nextLevel];
  if (!cost) return false;
  if (s.wood >= cost.wood && s.stone >= cost.stone && s.food >= cost.food && s.gold >= cost.gold) {
    s.wood -= cost.wood;
    s.stone -= cost.stone;
    s.food -= cost.food;
    s.gold -= cost.gold;
    s.buildingLevel = nextLevel;
    return true;
  }
  return false;
}

export const empireMode: GameModeStrategy = {
  id: "empire",
  name: "Empire Builder",
  description: "Build a civilization. Correct answers generate resources. Random events. Highest Empire Power wins.",
  metadata: {
    difficulty: "hard",
    recommendedPlayers: 12,
    estimatedDurationSec: 900,
    supportsTeams: false,
    supportsTournament: false,
    supportsSpectators: true,
    supportsReplay: true,
    displayNameKey: "gameModes.empire",
    descriptionKey: "gameModes.empire",
    shortDescription: "Civilization-building with random events",
    iconName: "castle",
    themeColor: "#16a34a",
  },

  createSession(_player, _config) {
    return {
      score: 0,
      modeState: {
        wood: 0, stone: 0, food: 0, gold: 0, buildingLevel: 0,
      } as EmpireModeState,
    };
  },

  startRound(_ctx, players, _config) {
    // Roll a random event for each player and apply it.
    const eventsByPlayer: Record<string, string> = {};
    for (const p of players) {
      const s = getEmpireState(p.modeState);
      const event = rollEvent();
      event.apply(s);
      s.lastEvent = event.id;
      eventsByPlayer[p.playerId] = event.id;
    }
    return {
      roundMetadata: { eventsByPlayer },
    };
  },

  processAnswer(input, player, _ctx, _config) {
    const s = getEmpireState(player.modeState);
    if (input.isCorrect) {
      const mult = productionMultiplier(s.buildingLevel);
      const baseWood = Math.floor(20 * mult);
      const baseStone = Math.floor(15 * mult);
      const baseFood = Math.floor(15 * mult);
      const baseGold = Math.floor(10 * mult);
      s.wood += baseWood;
      s.stone += baseStone;
      s.food += baseFood;
      s.gold += baseGold;
      // Try auto-upgrade if affordable
      const upgraded = tryUpgradeBuilding(s);
      // Score (for the generic leaderboard) = empire power
      player.modeState.score = computeEmpirePower(s);
      return {
        playerId: input.playerId,
        isCorrect: true,
        responseMs: input.responseMs,
        pointsAwarded: baseGold,
        outcome: upgraded ? "building_upgraded" : undefined,
        delta: { wood: baseWood, stone: baseStone, food: baseFood, gold: baseGold },
      };
    }
    return {
      playerId: input.playerId,
      isCorrect: false,
      responseMs: input.responseMs,
      pointsAwarded: 0,
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
    const sorted = [...players].sort((a, b) => {
      const ap = computeEmpirePower(getEmpireState(a.modeState));
      const bp = computeEmpirePower(getEmpireState(b.modeState));
      return bp - ap;
    });
    return sorted.map((p, i) => {
      const rank = i + 1;
      const prev = previousRank.get(p.playerId);
      const rankChange = prev != null ? prev - rank : 0;
      const s = getEmpireState(p.modeState);
      const power = computeEmpirePower(s);
      return {
        playerId: p.playerId,
        userId: p.userId,
        displayName: p.displayName,
        score: power,
        rank,
        accuracy: p.answeredCount > 0 ? p.correctCount / p.answeredCount : 0,
        avgResponseMs: p.answeredCount > 0 ? Math.round(p.totalResponseMs / p.answeredCount) : 0,
        streak: p.currentStreak,
        rankChange,
        modeDisplay: {
          wood: s.wood,
          stone: s.stone,
          food: s.food,
          gold: s.gold,
          buildingLevel: s.buildingLevel,
          buildingName: BUILDING_LEVELS[s.buildingLevel] ?? "none",
          empirePower: power,
          lastEvent: s.lastEvent,
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
      reason: "highest_empire_power",
    };
  },

  applyRewards(leaderboard, winner, _config) {
    const rewards: RewardSpec[] = [];
    leaderboard.forEach((entry, i) => {
      rewards.push({
        userId: entry.userId,
        rewardType: "xp",
        amount: 60 + Math.max(0, 100 - i * 20),
        reason: `Finished rank ${i + 1} in Empire Builder`,
      });
      // Convert gold to wallet coins (capped at 300)
      const gold = (entry.modeDisplay?.gold as number | undefined) ?? 0;
      rewards.push({
        userId: entry.userId,
        rewardType: "coins",
        amount: Math.min(300, Math.floor(gold)),
        reason: "Empire mode gold conversion",
      });
    });
    if (winner.userId) {
      rewards.push({
        userId: winner.userId,
        rewardType: "achievement",
        code: "emperor",
        reason: "Won an Empire Builder match",
      });
    }
    // Building-specific achievements
    leaderboard.forEach((entry) => {
      const lvl = (entry.modeDisplay?.buildingLevel as number | undefined) ?? 0;
      if (lvl >= 3) {
        rewards.push({
          userId: entry.userId,
          rewardType: "achievement",
          code: "town_builder",
          reason: "Reached Town level in Empire Builder",
        });
      }
      if (lvl >= 5) {
        rewards.push({
          userId: entry.userId,
          rewardType: "achievement",
          code: "empire_builder",
          reason: "Reached Empire level in Empire Builder",
        });
      }
    });
    return rewards;
  },

  finishGame(leaderboard, _config) {
    return {
      finalSnapshot: {
        mode: "empire",
        playerCount: leaderboard.length,
        topEmpirePower: leaderboard[0]?.score ?? 0,
        topPlayerId: leaderboard[0]?.playerId ?? null,
      },
    };
  },
};
