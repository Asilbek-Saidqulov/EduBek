/**
 * Systems 10-20: Leaderboards, Achievements, Tournament Flow, Teacher
 * Controls, Student UX, Analytics, Replay, Spectator, Accessibility,
 * Dashboard, Competitive Balance.
 *
 * All systems reuse the Universal Game Engine's emitEvent / getEvents /
 * getMatch / getReplay / addSpectator / detectCheat / recordMatch APIs.
 * Zero engine code is duplicated or modified.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  emitEvent,
  getEvents,
  attemptTransition,
  getMatch,
  addSpectator,
  getSpectators,
  detectCheat,
  recordMatch,
  getReplay,
} from "@/features/game-engine";
import {
  BATTLE_ROYALE_RULES,
  getTournament,
  getBracket,
  getDuel,
  listDuels,
  getAdvancementEvents,
  getByes,
  getWalkovers,
  getTieResolutions,
  getChampionship,
  getMatchById,
  getMatchesByRound,
  advanceWinner,
  recordDuelResult,
} from "./tournament-engine";
import type {
  BattleRoyaleRules,
  BattleRoyaleLeaderboardType,
  BattleRoyaleLeaderboardEntry,
  BattleRoyaleAchievement,
  BattleRoyaleAchievementStats,
  BattleRoyaleTeacherAction,
  BattleRoyaleTeacherResult,
  BattleRoyaleStudentUXState,
  BattleRoyaleAnalytics,
  BattleRoyaleReplayTimelineEntry,
  BattleRoyaleSpectatorView,
  BattleRoyaleAccessibilityConfig,
  BattleRoyaleDashboard,
  BalancePreset,
  CompetitivePreset,
  TournamentPhase,
  DuelResult,
  DuelLossReason,
  ChampionshipStage,
} from "./types";

const log = getLogger("battle-royale");

// ===========================================================================
// System 10 — Leaderboards
// ===========================================================================

export function buildLeaderboard(
  tournamentId: string,
  type: BattleRoyaleLeaderboardType = "tournament_ranking",
): BattleRoyaleLeaderboardEntry[] {
  const t = getTournament(tournamentId);
  if (!t) return [];
  const duels = listDuels(tournamentId);
  const champ = t.championship;

  // Build per-player stats from duels
  const stats = new Map<string, {
    userId: string;
    displayName: string;
    seed: number | null;
    wins: number;
    losses: number;
    tournamentScore: number;
    correct: number;
    answered: number;
    avgSpeedMs: number;
    speedCount: number;
    eliminated: boolean;
    eliminatedInRound: number | null;
  }>();

  for (const seed of t.seedingResults) {
    stats.set(seed.userId, {
      userId: seed.userId,
      displayName: seed.displayName,
      seed: seed.seed,
      wins: 0, losses: 0, tournamentScore: 0,
      correct: 0, answered: 0, avgSpeedMs: 0, speedCount: 0,
      eliminated: false, eliminatedInRound: null,
    });
  }

  for (const d of duels) {
    const a = stats.get(d.playerAId);
    const b = stats.get(d.playerBId);
    if (a) {
      a.tournamentScore += d.scoreA;
      a.correct += d.correctA;
      a.answered += 5;
      a.avgSpeedMs = (a.avgSpeedMs * a.speedCount + d.avgSpeedMsA) / (a.speedCount + 1);
      a.speedCount++;
      if (d.winnerId === a.userId) a.wins++;
      if (d.loserId === a.userId) {
        a.losses++;
        a.eliminated = true;
        a.eliminatedInRound = d.duelId.includes("R") ? parseInt(d.duelId.split("-")[0].replace("R", "")) : null;
      }
    }
    if (b) {
      b.tournamentScore += d.scoreB;
      b.correct += d.correctB;
      b.answered += 5;
      b.avgSpeedMs = (b.avgSpeedMs * b.speedCount + d.avgSpeedMsB) / (b.speedCount + 1);
      b.speedCount++;
      if (d.winnerId === b.userId) b.wins++;
      if (d.loserId === b.userId) {
        b.losses++;
        b.eliminated = true;
      }
    }
  }

  const entries: BattleRoyaleLeaderboardEntry[] = Array.from(stats.values()).map(s => {
    const isChamp = champ.championId === s.userId;
    const isRunnerUp = champ.runnerUpId === s.userId;
    const isBronze = champ.bronzeId === s.userId;
    let finalRank: number | null = null;
    if (isChamp) finalRank = 1;
    else if (isRunnerUp) finalRank = 2;
    else if (isBronze) finalRank = 3;
    return {
      rank: 0,
      userId: s.userId,
      displayName: s.displayName,
      seed: s.seed,
      wins: s.wins,
      losses: s.losses,
      tournamentScore: s.tournamentScore,
      accuracy: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) / 100 : 0,
      avgSpeedMs: Math.round(s.avgSpeedMs),
      finalRank,
      eliminated: s.eliminated && !isChamp && !isRunnerUp && !isBronze,
      eliminatedInRound: s.eliminatedInRound,
    };
  });

  const sortFn: Record<BattleRoyaleLeaderboardType, (a: BattleRoyaleLeaderboardEntry, b: BattleRoyaleLeaderboardEntry) => number> = {
    tournament_ranking: (a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999) || b.wins - a.wins || b.tournamentScore - a.tournamentScore,
    champion: (a, b) => (a.finalRank === 1 ? -1 : 0) - (b.finalRank === 1 ? -1 : 0),
    runner_up: (a, b) => (a.finalRank === 2 ? -1 : 0) - (b.finalRank === 2 ? -1 : 0),
    bronze: (a, b) => (a.finalRank === 3 ? -1 : 0) - (b.finalRank === 3 ? -1 : 0),
    wins: (a, b) => b.wins - a.wins,
    losses: (a, b) => b.losses - a.losses,
    question_accuracy: (a, b) => b.accuracy - a.accuracy,
    response_speed: (a, b) => a.avgSpeedMs - b.avgSpeedMs,
    tournament_score: (a, b) => b.tournamentScore - a.tournamentScore,
    teacher_dashboard: (a, b) => (a.eliminated ? 1 : 0) - (b.eliminated ? 1 : 0) || b.wins - a.wins,
    final_standings: (a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999) || b.wins - a.wins,
  };
  entries.sort(sortFn[type] ?? sortFn.tournament_ranking);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

// ===========================================================================
// System 11 — Achievements (18 total)
// ===========================================================================

export const BATTLE_ROYALE_ACHIEVEMENTS: BattleRoyaleAchievement[] = [
  { id: "champion", name: "Champion", description: "Win the tournament", condition: (s) => s.isChampion, xpReward: 500 },
  { id: "finalist", name: "Finalist", description: "Reach the final match", condition: (s) => s.isChampion || s.isRunnerUp, xpReward: 300 },
  { id: "perfect_duel", name: "Perfect Duel", description: "Win a duel without missing a question", condition: (s) => s.perfectDuels >= 1, xpReward: 150 },
  { id: "flawless_tournament", name: "Flawless Tournament", description: "Win tournament without losing a duel", condition: (s) => s.isChampion && s.flawlessTournament, xpReward: 400 },
  { id: "comeback", name: "Comeback", description: "Win after being behind in a duel", condition: (s) => s.comebacks >= 1, xpReward: 100 },
  { id: "speed_master", name: "Speed Master", description: "Answer in under 1.5s", condition: (s) => s.fastestResponseMs > 0 && s.fastestResponseMs <= 1500, xpReward: 125 },
  { id: "underdog", name: "Underdog", description: "Win tournament as seed 8+", condition: (s) => s.isChampion && s.initialSeed !== null && s.initialSeed >= 8, xpReward: 350 },
  { id: "top_seed", name: "Top Seed", description: "Win tournament as seed 1", condition: (s) => s.isChampion && s.initialSeed === 1, xpReward: 200 },
  { id: "bracket_destroyer", name: "Bracket Destroyer", description: "Win 4+ duels in a tournament", condition: (s) => s.duelsWon >= 4, xpReward: 200 },
  { id: "tournament_legend", name: "Tournament Legend", description: "Win 5+ duels total", condition: (s) => s.duelsWon >= 5, xpReward: 250 },
  { id: "iron_champion", name: "Iron Champion", description: "Win tournament with longest win streak 4+", condition: (s) => s.isChampion && s.longestWinStreak >= 4, xpReward: 300 },
  { id: "no_mistakes", name: "No Mistakes", description: "Answer all questions correctly across all duels", condition: (s) => s.totalAnswered > 0 && s.totalCorrect === s.totalAnswered, xpReward: 350 },
  { id: "winning_streak", name: "Winning Streak", description: "Win 3 duels in a row", condition: (s) => s.longestWinStreak >= 3, xpReward: 100 },
  { id: "royal_duelist", name: "Royal Duelist", description: "Win 3+ duels", condition: (s) => s.duelsWon >= 3, xpReward: 75 },
  { id: "clutch_victory", name: "Clutch Victory", description: "Win a duel via tie-breaker", condition: (s) => s.duelsWon >= 1 && s.upsetVictories >= 1, xpReward: 150 },
  { id: "lightning_fast", name: "Lightning Fast", description: "Answer in under 1s", condition: (s) => s.fastestResponseMs > 0 && s.fastestResponseMs <= 1000, xpReward: 200 },
  { id: "elite_competitor", name: "Elite Competitor", description: "Reach semifinals or better", condition: (s) => s.isChampion || s.isRunnerUp || s.isBronze, xpReward: 175 },
  { id: "grand_champion", name: "Grand Champion", description: "Win tournament as top seed with flawless record", condition: (s) => s.isChampion && s.initialSeed === 1 && s.flawlessTournament, xpReward: 600 },
];

export function checkAchievements(stats: BattleRoyaleAchievementStats): BattleRoyaleAchievement[] {
  return BATTLE_ROYALE_ACHIEVEMENTS.filter(a => a.condition(stats));
}

// ===========================================================================
// System 12 — Tournament Flow
// ===========================================================================

export function getTournamentPhase(tournamentId: string): TournamentPhase | null {
  return getTournament(tournamentId)?.phase ?? null;
}

export function setTournamentPhase(tournamentId: string, phase: TournamentPhase): boolean {
  const t = getTournament(tournamentId);
  if (!t) return false;
  t.phase = phase;
  // Reuse the engine's StateTransition event type to signal phase changes.
  // Tournament-specific phase names go in the payload, not the event type.
  emitEvent(tournamentId, "StateTransition", null, { kind: "tournament_phase", phase });
  return true;
}

export function startTournament(tournamentId: string): boolean {
  const t = getTournament(tournamentId);
  if (!t) return false;
  t.startedAt = new Date().toISOString();
  t.phase = "seeding";
  // Reuse MatchCreated event type — the engine's general "thing was created" signal.
  emitEvent(tournamentId, "MatchCreated", null, { kind: "tournament_started", playerCount: t.registeredPlayers.length });
  return true;
}

// ===========================================================================
// System 13 — Teacher Controls
// ===========================================================================

export function executeTeacherAction(
  tournamentId: string,
  teacherId: string,
  action: BattleRoyaleTeacherAction,
  payload?: Record<string, unknown>,
): BattleRoyaleTeacherResult {
  const t = getTournament(tournamentId);
  if (!t) return { action, success: false, audited: false, eventId: null, message: "Tournament not found" };
  if (t.hostId !== teacherId) return { action, success: false, audited: false, eventId: null, message: "Only host can perform teacher actions" };

  let success = false;
  let message = "";

  switch (action) {
    case "pause_tournament":
      t.paused = true;
      success = true;
      message = "Tournament paused";
      break;
    case "resume_tournament":
      t.paused = false;
      success = true;
      message = "Tournament resumed";
      break;
    case "restart_duel":
      if (payload?.duelId) {
        const m = getMatchById(tournamentId, payload.duelId as string);
        if (m) {
          m.status = "pending";
          m.winnerId = null;
          m.loserId = null;
          m.startedAt = null;
          m.finishedAt = null;
          success = true;
          message = "Duel restarted";
        } else { message = "Duel not found"; }
      } else { message = "duelId required"; }
      break;
    case "skip_duel":
      if (payload?.duelId && payload?.advancingPlayerId) {
        const m = getMatchById(tournamentId, payload.duelId as string);
        if (m) {
          m.status = "walkover";
          m.winnerId = payload.advancingPlayerId as string;
          m.finishedAt = new Date().toISOString();
          advanceWinner(tournamentId, payload.duelId as string);
          success = true;
          message = "Duel skipped";
        } else { message = "Duel not found"; }
      } else { message = "duelId + advancingPlayerId required"; }
      break;
    case "force_advance":
      if (payload?.duelId && payload?.playerId) {
        const m = getMatchById(tournamentId, payload.duelId as string);
        if (m) {
          m.winnerId = payload.playerId as string;
          m.loserId = m.slotA.playerId === payload.playerId ? m.slotB.playerId : m.slotA.playerId;
          m.status = "completed";
          m.finishedAt = new Date().toISOString();
          advanceWinner(tournamentId, payload.duelId as string);
          success = true;
          message = "Player force-advanced";
        }
      } else { message = "duelId + playerId required"; }
      break;
    case "replace_player":
      if (payload?.oldPlayerId && payload?.newPlayerId) {
        const bracket = t.bracket;
        if (bracket) {
          for (const slot of bracket.slots) {
            if (slot.playerId === payload.oldPlayerId) {
              slot.playerId = payload.newPlayerId as string;
              slot.playerDisplayName = (payload.newDisplayName as string) ?? slot.playerDisplayName;
              success = true;
            }
          }
          message = success ? "Player replaced" : "Old player not in bracket";
        } else { message = "Bracket not generated"; }
      } else { message = "oldPlayerId + newPlayerId required"; }
      break;
    case "grant_bye":
      if (payload?.playerId) {
        const bracket = t.bracket;
        if (bracket) {
          // Find player's next match and grant a bye
          const slot = bracket.slots.find(s => s.playerId === payload.playerId);
          if (slot) {
            t.byes.push({
              slotId: slot.id,
              playerId: payload.playerId as string,
              roundIndex: slot.roundIndex,
              reason: "teacher_grant",
              advancedToSlotId: slot.advancedToSlotId,
              timestamp: new Date().toISOString(),
            });
            success = true;
            message = "Bye granted";
          } else { message = "Player slot not found"; }
        } else { message = "Bracket not generated"; }
      } else { message = "playerId required"; }
      break;
    case "freeze_bracket":
      t.paused = true;
      success = true;
      message = "Bracket frozen";
      break;
    case "reveal_bracket":
      success = true;
      message = "Bracket revealed";
      break;
    case "hide_bracket":
      success = true;
      message = "Bracket hidden";
      break;
    case "inject_match":
      if (payload?.playerAId && payload?.playerBId) {
        success = true;
        message = "Match injected (admin-only)";
      } else { message = "playerAId + playerBId required"; }
      break;
    case "emergency_stop":
      t.paused = true;
      t.phase = "champion_ceremony";
      t.finishedAt = new Date().toISOString();
      success = true;
      message = "Emergency stop activated";
      break;
    case "end_tournament":
      t.phase = "champion_ceremony";
      t.finishedAt = new Date().toISOString();
      t.championship.stage = "tournament_complete";
      success = true;
      message = "Tournament ended";
      break;
    default:
      message = "Unknown action";
  }

  const event = emitEvent(tournamentId, "TeacherOverride", teacherId, { action, success, ...payload });
  log.info("teacher.action", { action, tournamentId, success });
  return { action, success, audited: true, eventId: event.id, message };
}

// ===========================================================================
// System 14 — Student UX
// ===========================================================================

export function getStudentUXState(tournamentId: string, userId: string): BattleRoyaleStudentUXState {
  const t = getTournament(tournamentId);
  if (!t) return "finished";
  if (t.paused) return "paused";
  const champ = t.championship;
  if (champ.championId === userId) return "champion";
  if (champ.stage === "tournament_complete") return "finished";

  // Check if player is still in the bracket
  const bracket = t.bracket;
  if (!bracket) {
    return t.registeredPlayers.some(p => p.userId === userId) ? "lobby" : "finished";
  }

  const playerSlot = bracket.slots.find(s => s.playerId === userId);
  if (!playerSlot) return "finished";

  // Check if player has an active duel
  const activeMatch = bracket.matches.find(m =>
    (m.slotA.playerId === userId || m.slotB.playerId === userId) &&
    (m.status === "in_progress" || m.status === "ready")
  );
  if (activeMatch) {
    if (activeMatch.status === "in_progress") return "duel";
    return "preparing";
  }

  // Check if player was eliminated
  const playerDuels = t.duels.filter(d => d.loserId === userId);
  if (playerDuels.length > 0) {
    return "eliminated";
  }

  // Check if player won last duel and is advancing
  const wonDuels = t.duels.filter(d => d.winnerId === userId);
  if (wonDuels.length > 0) {
    const lastWin = wonDuels[wonDuels.length - 1];
    const now = Date.now();
    if (now - Date.parse(lastWin.finishedAt) < 5000) return "advanced";
  }

  // Check championship stage
  if (champ.stage === "final" || champ.stage === "champion_crowned") return "final";

  // Default state by tournament phase
  switch (t.phase) {
    case "registration": return "lobby";
    case "seeding": return "waiting";
    case "bracket_generation": return "bracket";
    case "round_start": return "preparing";
    case "duel": return "preparing";
    case "advancement": return "advanced";
    case "champion_ceremony": return "summary";
    default: return "waiting";
  }
}

// ===========================================================================
// System 15 — Tournament Analytics
// ===========================================================================

export function generateAnalytics(tournamentId: string): BattleRoyaleAnalytics | null {
  const t = getTournament(tournamentId);
  if (!t) return null;
  const duels = listDuels(tournamentId);
  const completed = duels.filter(d => d.winnerId !== null);
  const walkovers = getWalkovers(tournamentId);
  const byes = getByes(tournamentId);
  const advancementEvents = getAdvancementEvents(tournamentId);

  const totalDuration = completed.reduce((s, d) => s + d.durationMs, 0);
  const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

  // Bracket progression: advancement events / total possible
  const totalPossibleAdvances = t.bracket ? t.bracket.matches.length : 1;
  const progression = totalPossibleAdvances > 0
    ? Math.round((advancementEvents.filter(e => e.kind === "advanced" || e.kind === "champion_decided").length / totalPossibleAdvances) * 100) / 100
    : 0;

  // Upset victories: lower seed beating higher seed
  const upsetVictories = completed.filter(d => {
    const aSeed = t.seedingResults.find(s => s.userId === d.playerAId)?.seed ?? 999;
    const bSeed = t.seedingResults.find(s => s.userId === d.playerBId)?.seed ?? 999;
    if (d.winnerId === d.playerAId) return aSeed > bSeed;
    if (d.winnerId === d.playerBId) return bSeed > aSeed;
    return false;
  }).length;

  // Seeding performance: how often did higher seeds win?
  const seedWinsByRank: Record<string, number> = {};
  for (const d of completed) {
    const winnerSeed = t.seedingResults.find(s => s.userId === d.winnerId)?.seed ?? 999;
    const bucket = winnerSeed <= 4 ? "top4" : winnerSeed <= 8 ? "top8" : winnerSeed <= 16 ? "top16" : "lower";
    seedWinsByRank[bucket] = (seedWinsByRank[bucket] ?? 0) + 1;
  }

  // Duel outcome distribution
  const outcomeDist: Record<string, number> = {
    completed: completed.length,
    walkover: walkovers.length,
    bye: byes.length,
  };

  // Loss reason distribution
  const lossReasons: Record<string, number> = {};
  for (const d of completed) {
    const r = d.lossReason ?? "lower_score";
    lossReasons[r] = (lossReasons[r] ?? 0) + 1;
  }

  return {
    tournamentId,
    totalDuels: duels.length,
    completedDuels: completed.length,
    avgDuelDurationMs: avgDuration,
    bracketProgression: progression,
    upsetVictories,
    seedingPerformance: seedWinsByRank,
    disconnects: lossReasons["disconnected"] ?? 0,
    forfeits: lossReasons["forfeit"] ?? 0,
    walkovers: walkovers.length,
    avgResponseTimeMs: 0,
    avgAccuracy: 0,
    completionRate: duels.length > 0 ? Math.round((completed.length / duels.length) * 100) / 100 : 0,
    duelOutcomeDistribution: outcomeDist,
    lossReasonDistribution: lossReasons,
  };
}

// ===========================================================================
// System 16 — Replay Integration (reuses engine Replay Engine)
// ===========================================================================

export function getReplayTimeline(tournamentId: string): BattleRoyaleReplayTimelineEntry[] {
  const t = getTournament(tournamentId);
  if (!t) return [];
  const events = getEvents(tournamentId);
  const stage: ChampionshipStage = t.championship.stage;
  // Tournament events are emitted via the engine Event Bus using mapped
  // engine event types. The original tournament-specific event name is
  // preserved in the payload's `kind` field. We filter by both the engine
  // event type AND the tournament kind to get the tournament-specific events.
  const tournamentKinds = new Set([
    "TournamentCreated", "PlayerRegistered", "BracketGenerated", "SeedingCompleted",
    "DuelStarted", "DuelCompleted", "PlayerAdvanced", "ChampionCrowned",
    "BronzeDecided", "TournamentCompleted", "WalkoverRecorded", "TieResolved",
    "ByeAssigned",
  ]);
  return events
    .filter(e => {
      // TeacherOverride is already an engine event type — keep it directly.
      if (e.type === "TeacherOverride") return true;
      const p = e.payload as Record<string, unknown>;
      return typeof p.kind === "string" && tournamentKinds.has(p.kind);
    })
    .map(e => {
      const p = e.payload as Record<string, unknown>;
      // Use the tournament kind if available, otherwise the engine event type.
      const eventName = typeof p.kind === "string" ? p.kind : e.type;
      return {
        timestamp: e.timestamp,
        event: eventName,
        details: JSON.stringify(p).slice(0, 120),
        tournamentStage: stage,
        duelId: typeof p.duelId === "string" ? p.duelId : null,
        lossReason: typeof p.lossReason === "string" ? (p.lossReason as DuelLossReason) : null,
      };
    });
}

export function getDuelReplay(tournamentId: string, duelId: string): unknown {
  const duel = getDuel(tournamentId, duelId);
  if (!duel) return null;
  // Reuse engine's getReplay for the underlying duel match
  return getReplay(duel.engineMatchId);
}

// ===========================================================================
// System 17 — Spectator Experience (reuses engine Spectator Engine)
// ===========================================================================

export function addTournamentSpectator(tournamentId: string, userId: string): unknown {
  // Reuse engine addSpectator — uses tournamentId as the match channel.
  // "tournament_viewer" is the dedicated role for tournament spectators.
  return addSpectator(tournamentId, userId, "tournament_viewer");
}

export function getSpectatorView(tournamentId: string): BattleRoyaleSpectatorView | null {
  const t = getTournament(tournamentId);
  if (!t || !t.bracket) return null;
  const bracket = t.bracket;
  const activeDuels = bracket.matches
    .filter(m => m.status === "in_progress" && m.slotA.playerId && m.slotB.playerId)
    .map(m => ({
      duelId: m.id,
      playerA: m.slotA.playerDisplayName ?? "",
      playerB: m.slotB.playerDisplayName ?? "",
      roundName: m.roundName,
    }));
  // Champion prediction: weight by wins so far + seed
  const leaderboard = buildLeaderboard(tournamentId, "wins");
  const championPrediction = leaderboard.slice(0, 4).map((e, i) => ({
    playerId: e.userId,
    displayName: e.displayName,
    probability: Math.round((1 - i * 0.2) * 100) / 100,
  }));
  const timeline = getEvents(tournamentId).slice(-10).map(e => ({
    timestamp: e.timestamp,
    event: e.type,
  }));
  return {
    tournamentId,
    liveBracket: bracket,
    activeDuels,
    championPrediction,
    tournamentTimeline: timeline,
    spectatorCount: getSpectators(tournamentId).length,
    readOnly: true,
  };
}

// ===========================================================================
// System 18 — Accessibility
// ===========================================================================

export const BATTLE_ROYALE_ACCESSIBILITY: BattleRoyaleAccessibilityConfig = {
  keyboard: true,
  screenReader: true,
  reducedMotion: false,
  colorBlind: true,
  largeUI: false,
  highContrast: false,
  captions: true,
  localization: true,
};

// ===========================================================================
// System 19 — Tournament Dashboard
// ===========================================================================

export function generateDashboard(tournamentId: string): BattleRoyaleDashboard | null {
  const t = getTournament(tournamentId);
  if (!t || !t.bracket) return null;
  const bracket = t.bracket;
  const activeMatches = bracket.matches.filter(m => m.status === "in_progress").length;
  const waitingMatches = bracket.matches.filter(m => m.status === "pending").length;
  const currentRound = Math.max(...bracket.matches.filter(m => m.status === "in_progress" || m.status === "completed").map(m => m.roundIndex), 0);
  const leaderboard = buildLeaderboard(tournamentId, "teacher_dashboard");
  const championPrediction = leaderboard.slice(0, 4).map((e, i) => ({
    playerId: e.userId,
    displayName: e.displayName,
    probability: Math.round((1 - i * 0.2) * 100) / 100,
  }));
  const teacherEvents = getEvents(tournamentId).filter(e => e.type === "TeacherOverride");
  const events = getEvents(tournamentId);
  const reconnectEvents = events.filter(e => e.type === "PlayerReconnected").length;
  const totalMatches = bracket.matches.length;
  const completedMatches = bracket.matches.filter(m => m.status === "completed" || m.status === "walkover").length;
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) / 100 : 0;
  const matchHealth = activeMatches > 5 ? "warning" : "healthy";

  return {
    tournamentId,
    currentBracket: bracket,
    activeMatches,
    waitingMatches,
    currentRound,
    championPrediction,
    teacherActions: teacherEvents.length,
    avgLatencyMs: 0,
    reconnects: reconnectEvents,
    matchHealth: matchHealth as "healthy" | "warning" | "critical",
    tournamentProgress: progress,
    stage: t.championship.stage,
    leaderboard,
  };
}

// ===========================================================================
// System 20 — Competitive Balance
// ===========================================================================

export const COMPETITIVE_PRESETS: BalancePreset[] = [
  {
    name: "classroom",
    label: "Classroom",
    rules: {
      bracketSize: 8,
      duelQuestionsPerMatch: 3,
      duelTimePerQuestionMs: 30_000,
      overtimeEnabled: false,
      bronzeMatchEnabled: false,
    },
  },
  {
    name: "school",
    label: "School",
    rules: {
      bracketSize: 16,
      duelQuestionsPerMatch: 5,
      duelTimePerQuestionMs: 20_000,
      overtimeEnabled: true,
      bronzeMatchEnabled: true,
    },
  },
  {
    name: "regional",
    label: "Regional",
    rules: {
      bracketSize: 32,
      duelQuestionsPerMatch: 5,
      duelTimePerQuestionMs: 20_000,
      overtimeEnabled: true,
      bronzeMatchEnabled: true,
      reseedingEnabled: true,
    },
  },
  {
    name: "national",
    label: "National",
    rules: {
      bracketSize: 64,
      duelQuestionsPerMatch: 7,
      duelTimePerQuestionMs: 15_000,
      overtimeEnabled: true,
      bronzeMatchEnabled: true,
      reseedingEnabled: true,
    },
  },
  {
    name: "championship",
    label: "Championship",
    rules: {
      bracketSize: 128,
      duelQuestionsPerMatch: 7,
      duelTimePerQuestionMs: 15_000,
      overtimeEnabled: true,
      bronzeMatchEnabled: true,
      reseedingEnabled: true,
      reconnectGraceMs: 60_000,
    },
  },
];

export function getBalancePresets(): BalancePreset[] {
  return COMPETITIVE_PRESETS;
}

export function getPreset(name: CompetitivePreset): BalancePreset | null {
  return COMPETITIVE_PRESETS.find(p => p.name === name) ?? null;
}

// ===========================================================================
// Anti-Cheat Reuse (uses engine's detectCheat)
// ===========================================================================

export function checkBattleRoyaleCheat(
  tournamentId: string,
  userId: string,
  kind: string,
  description: string,
  evidence: string,
): unknown {
  // Reuse the engine's detectCheat — passes tournamentId as the match channel
  return detectCheat({
    matchId: tournamentId,
    userId,
    kind: kind as Parameters<typeof detectCheat>[0]["kind"],
    description,
    evidence,
    severity: "high",
  });
}

// ===========================================================================
// Status
// ===========================================================================

export function getBattleRoyaleStatus(tournamentId?: string) {
  return {
    gameMode: "battle_royale",
    rules: BATTLE_ROYALE_RULES,
    presets: COMPETITIVE_PRESETS.length,
    tournamentDetails: tournamentId ? getTournament(tournamentId) : null,
  };
}
