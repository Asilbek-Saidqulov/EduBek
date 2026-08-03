/**
 * Systems 1-9: Tournament, Bracket, Seeding, Duel, Advancement, Bye,
 * Walkover, Tie Resolution, Championship.
 *
 * All systems reuse the Universal Game Engine for every duel:
 *   - createMatch() for each duel
 *   - attemptTransition() for lifecycle
 *   - emitEvent() for the Event Bus
 *   - Lobby / Session / Timer / Sync / Replay / Spectator / Reconnect /
 *     Anti-Cheat / Score Pipeline / Match Recorder / Analytics — all reused
 *
 * Zero engine code is duplicated or modified.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  createMatch,
  attemptTransition,
  emitEvent,
  getMatch,
} from "@/features/game-engine";
import type {
  BattleRoyaleRules,
  TournamentFormat,
  Bracket,
  BracketSize,
  BracketSlot,
  BracketMatch,
  BracketVisual,
  BracketRoundName,
  SeedingStrategy,
  SeedingInput,
  SeedingResult,
  DuelConfig,
  DuelResult,
  DuelStatus,
  DuelLossReason,
  AdvancementEvent,
  AdvancementEventKind,
  ByeAssignment,
  WalkoverReason,
  WalkoverRecord,
  TieResolutionStrategy,
  TieResolutionResult,
  ChampionshipState,
  ChampionshipStage,
  CelebrationEvent,
  TournamentState,
  TournamentPhase,
} from "./types";

const log = getLogger("battle-royale");

// ===========================================================================
// In-memory tournament registry (no Prisma — engine owns persistence)
// ===========================================================================

const tournaments = new Map<string, TournamentState>();

export function getTournament(id: string): TournamentState | null {
  return tournaments.get(id) ?? null;
}

export function listTournaments(): TournamentState[] {
  return Array.from(tournaments.values());
}

export function destroyTournament(id: string): boolean {
  return tournaments.delete(id);
}

// ===========================================================================
// System 1 — Tournament Engine
// ===========================================================================

export const BATTLE_ROYALE_RULES: BattleRoyaleRules = {
  gameMode: "battle_royale",
  format: "single_elimination",
  minPlayers: 2,
  maxPlayers: 256,
  bracketSize: 16,
  bronzeMatchEnabled: true,
  thirdPlaceMatchEnabled: true,
  reseedingEnabled: false,
  overtimeEnabled: true,
  overtimeMs: 15_000,
  tieResolution: "fastest_response",
  allowSpectators: true,
  allowLateJoin: false,
  reconnectPolicy: "limited",
  reconnectGraceMs: 30_000,
  hostControls: [
    "pause_tournament", "resume_tournament", "restart_duel", "skip_duel",
    "force_advance", "replace_player", "grant_bye", "freeze_bracket",
    "reveal_bracket", "hide_bracket", "inject_match", "emergency_stop",
    "end_tournament",
  ],
  organizationRestricted: false,
  duelQuestionsPerMatch: 5,
  duelTimePerQuestionMs: 20_000,
  duelWinCondition: "highest_score",
  duelTargetCorrect: 3,
  basePointsPerCorrect: 100,
  speedBonusFastMs: 3_000,
  speedBonusFastPoints: 100,
  speedBonusMediumMs: 6_000,
  speedBonusMediumPoints: 50,
};

export function getRules(): BattleRoyaleRules {
  return { ...BATTLE_ROYALE_RULES };
}

export function createTournament(input: {
  hostId: string;
  organizationId?: string | null;
  rules?: Partial<BattleRoyaleRules>;
  preset?: TournamentState["preset"];
  seedingStrategy?: SeedingStrategy;
}): TournamentState {
  const id = randomUUID();
  const rules: BattleRoyaleRules = { ...BATTLE_ROYALE_RULES, ...(input.rules ?? {}) };
  const tournament: TournamentState = {
    id,
    hostId: input.hostId,
    organizationId: input.organizationId ?? null,
    rules,
    preset: input.preset ?? "school",
    registeredPlayers: [],
    seedingStrategy: input.seedingStrategy ?? "random",
    seedingResults: [],
    bracket: null,
    championship: {
      tournamentId: id,
      stage: "pending",
      championId: null,
      championDisplayName: null,
      runnerUpId: null,
      runnerUpDisplayName: null,
      bronzeId: null,
      bronzeDisplayName: null,
      finalistCount: 0,
      celebrationEvents: [],
      crownedAt: null,
    },
    advancementEvents: [],
    byes: [],
    walkovers: [],
    tieResolutions: [],
    duels: [],
    phase: "registration",
    paused: false,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
  };
  tournaments.set(id, tournament);
  emitTournamentEvent(id, "TournamentCreated", null, { hostId: input.hostId, rules });
  log.info("tournament.created", { id, hostId: input.hostId });
  return tournament;
}

export function registerPlayer(tournamentId: string, player: SeedingInput): boolean {
  const t = tournaments.get(tournamentId);
  if (!t) return false;
  if (t.registeredPlayers.length >= t.rules.maxPlayers) return false;
  if (t.registeredPlayers.some(p => p.userId === player.userId)) return false;
  t.registeredPlayers.push(player);
  emitTournamentEvent(tournamentId, "PlayerRegistered", player.userId, { displayName: player.displayName });
  return true;
}

export function unregisterPlayer(tournamentId: string, userId: string): boolean {
  const t = tournaments.get(tournamentId);
  if (!t) return false;
  const before = t.registeredPlayers.length;
  t.registeredPlayers = t.registeredPlayers.filter(p => p.userId !== userId);
  return t.registeredPlayers.length < before;
}

export function setSeedingStrategy(tournamentId: string, strategy: SeedingStrategy): boolean {
  const t = tournaments.get(tournamentId);
  if (!t) return false;
  t.seedingStrategy = strategy;
  return true;
}

// ===========================================================================
// System 2 — Bracket Engine
// ===========================================================================

const ROUND_NAMES: Record<number, BracketRoundName> = {
  0: "round_of_256",
  1: "round_of_128",
  2: "round_of_64",
  3: "round_of_32",
  4: "round_of_16",
  5: "quarterfinal",
  6: "semifinal",
  7: "final",
  8: "bronze_match",
};

/**
 * Returns the round name for a given bracket size + round index.
 * Bracket sizes 8..256 always produce a "final" round at the highest
 * index, with "semifinal" one step before, "quarterfinal" two before, etc.
 */
function roundNameFor(size: BracketSize, roundIndex: number): BracketRoundName {
  const totalRounds = Math.log2(size);
  if (roundIndex === totalRounds - 1) return "final";
  if (roundIndex === totalRounds - 2) return "semifinal";
  if (roundIndex === totalRounds - 3) return "quarterfinal";
  // For lower rounds, name them by the player count at that round.
  const playersAtRound = size / Math.pow(2, roundIndex);
  switch (playersAtRound) {
    case 16: return "round_of_16";
    case 32: return "round_of_32";
    case 64: return "round_of_64";
    case 128: return "round_of_128";
    case 256: return "round_of_256";
    default: return "round_of_16";
  }
}

export function generateBracket(tournamentId: string): Bracket | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const size = t.rules.bracketSize;
  const rounds = Math.log2(size);
  const slots: BracketSlot[] = [];
  const matches: BracketMatch[] = [];

  // Generate slots for each round
  for (let r = 0; r < rounds; r++) {
    const slotsInRound = size / Math.pow(2, r);
    for (let s = 0; s < slotsInRound; s++) {
      const slotId = `R${r + 1}-S${s + 1}`;
      slots.push({
        id: slotId,
        roundIndex: r,
        roundName: roundNameFor(size, r),
        slotIndex: s,
        playerId: null,
        playerDisplayName: null,
        seed: null,
        isBye: false,
        advancedToSlotId: null,
      });
    }
  }

  // Generate matches for each round (except the last, which is the final itself — still a match)
  for (let r = 0; r < rounds; r++) {
    const slotsInRound = size / Math.pow(2, r);
    const matchesInRound = slotsInRound / 2;
    for (let m = 0; m < matchesInRound; m++) {
      const slotAIdx = sumPreviousRounds(size, r) + m * 2;
      const slotBIdx = slotAIdx + 1;
      const slotA = slots[slotAIdx];
      const slotB = slots[slotBIdx];
      const nextRoundSlotIdx = sumPreviousRounds(size, r + 1) + m;
      const nextSlotId = r + 1 < rounds ? slots[nextRoundSlotIdx].id : null;
      const visual: BracketVisual = {
        column: r,
        row: m,
        nextSlotId,
        sourceSlotIds: r === 0 ? [] : [slotA.id, slotB.id],
      };
      matches.push({
        id: `M-${slotA.id}-${slotB.id}`,
        roundIndex: r,
        roundName: roundNameFor(size, r),
        slotA,
        slotB,
        engineMatchId: null,
        status: "pending",
        winnerId: null,
        loserId: null,
        startedAt: null,
        finishedAt: null,
        visual,
      });
    }
  }

  // Assign seeded players + byes to first-round slots
  const playerCount = t.seedingResults.length;
  const byeCount = size - playerCount;
  for (let i = 0; i < playerCount; i++) {
    const slot = slots[i];
    const seed = t.seedingResults[i];
    slot.playerId = seed.userId;
    slot.playerDisplayName = seed.displayName;
    slot.seed = seed.seed;
  }
  // Remaining slots become byes — opponent auto-advances.
  // Each bye slot is also recorded as a ByeAssignment so the Bye Engine
  // has a complete audit trail (used for analytics + teacher dashboard).
  for (let i = playerCount; i < size; i++) {
    const slot = slots[i];
    slot.isBye = true;
    slot.playerId = null;
    slot.playerDisplayName = "BYE";
    t.byes.push({
      slotId: slot.id,
      playerId: "",
      roundIndex: 0,
      reason: "bracket_imbalance",
      advancedToSlotId: null,
      timestamp: new Date().toISOString(),
    });
  }
  if (byeCount > 0) {
    emitTournamentEvent(tournamentId, "ByeAssigned", null, { count: byeCount, reason: "bracket_imbalance" });
  }

  const bracket: Bracket = {
    tournamentId,
    size,
    rounds,
    totalSlots: slots.length,
    totalMatches: matches.length,
    slots,
    matches,
    championSlotId: null,
    runnerUpSlotId: null,
    bronzeSlotId: null,
    createdAt: new Date().toISOString(),
  };
  t.bracket = bracket;
  t.phase = "bracket_generation";
  emitTournamentEvent(tournamentId, "BracketGenerated", null, { size, totalMatches: matches.length });
  log.info("bracket.generated", { tournamentId, size, rounds, matches: matches.length });
  return bracket;
}

function sumPreviousRounds(size: number, round: number): number {
  let sum = 0;
  for (let r = 0; r < round; r++) sum += size / Math.pow(2, r);
  return sum;
}

export function getBracket(tournamentId: string): Bracket | null {
  return tournaments.get(tournamentId)?.bracket ?? null;
}

export function getMatchById(tournamentId: string, matchId: string): BracketMatch | null {
  const b = tournaments.get(tournamentId)?.bracket;
  if (!b) return null;
  return b.matches.find(m => m.id === matchId) ?? null;
}

export function getMatchesByRound(tournamentId: string, roundIndex: number): BracketMatch[] {
  const b = tournaments.get(tournamentId)?.bracket;
  if (!b) return [];
  return b.matches.filter(m => m.roundIndex === roundIndex);
}

// ===========================================================================
// System 3 — Seeding Engine
// ===========================================================================

export function seedPlayers(tournamentId: string, strategy?: SeedingStrategy): SeedingResult[] {
  const t = tournaments.get(tournamentId);
  if (!t) return [];
  const strat = strategy ?? t.seedingStrategy;
  const players = [...t.registeredPlayers];
  const results: SeedingResult[] = [];

  switch (strat) {
    case "random":
      shuffleInPlace(players);
      break;
    case "previous_score":
      players.sort((a, b) => (b.previousScore ?? 0) - (a.previousScore ?? 0));
      break;
    case "teacher_defined":
      players.sort((a, b) => (a.teacherSeed ?? 999) - (b.teacherSeed ?? 999));
      break;
    case "rating_based":
      players.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "organization_ranking":
      players.sort((a, b) => (a.organizationRank ?? 999) - (b.organizationRank ?? 999));
      break;
    case "balanced_random":
      // Sort by rating desc, then interleave top-half with bottom-half for balanced matches
      players.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      const top = players.slice(0, Math.ceil(players.length / 2));
      const bottom = players.slice(Math.ceil(players.length / 2));
      const interleaved: SeedingInput[] = [];
      for (let i = 0; i < top.length || i < bottom.length; i++) {
        if (i < top.length) interleaved.push(top[i]);
        if (i < bottom.length) interleaved.push(bottom[i]);
      }
      players.length = 0;
      players.push(...interleaved);
      break;
  }

  for (let i = 0; i < players.length; i++) {
    results.push({
      userId: players[i].userId,
      displayName: players[i].displayName,
      seed: i + 1,
      strategy: strat,
    });
  }
  t.seedingResults = results;
  t.seedingStrategy = strat;
  t.phase = "seeding";
  emitTournamentEvent(tournamentId, "SeedingCompleted", null, { strategy: strat, count: results.length });
  log.info("seeding.completed", { tournamentId, strategy: strat, count: results.length });
  return results;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ===========================================================================
// System 4 — Duel Engine (reuses Universal Match Engine)
// ===========================================================================

export function getDuelConfig(tournamentId: string): DuelConfig {
  const t = tournaments.get(tournamentId);
  if (!t) throw new Error("Tournament not found");
  return {
    questionsPerMatch: t.rules.duelQuestionsPerMatch,
    timePerQuestionMs: t.rules.duelTimePerQuestionMs,
    winCondition: t.rules.duelWinCondition,
    targetCorrect: t.rules.duelTargetCorrect,
    overtimeEnabled: t.rules.overtimeEnabled,
    overtimeMs: t.rules.overtimeMs,
    tieBreaker: t.rules.tieResolution,
  };
}

/**
 * Start a duel by creating an engine match. The engine manages all gameplay,
 * scoring, timer, sync, events, replay, spectators, anti-cheat. Battle Royale
 * only records the tournament-side metadata.
 */
export function startDuel(tournamentId: string, matchId: string): DuelResult | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;
  const match = b.matches.find(m => m.id === matchId);
  if (!match) return null;
  if (!match.slotA.playerId || !match.slotB.playerId) return null;
  if (match.slotA.isBye || match.slotB.isBye) return null;
  if (match.status !== "pending" && match.status !== "ready") return null;

  // Reuse the Universal Game Engine to create the actual match
  const engineMatch = createMatch({
    hostId: t.hostId,
    organizationId: t.organizationId ?? undefined,
    gameMode: "battle_royale",
    settings: {
      maxPlayers: 2,
      minPlayers: 2,
      roundCount: t.rules.duelQuestionsPerMatch,
      questionPerRound: 1,
      timePerQuestion: t.rules.duelTimePerQuestionMs,
      allowLateJoin: false,
      allowSpectators: t.rules.allowSpectators,
      isPrivate: true,
      organizationRestricted: t.rules.organizationRestricted,
    },
  });

  match.engineMatchId = engineMatch.id;
  match.status = "in_progress";
  match.startedAt = new Date().toISOString();
  t.phase = "duel";
  emitTournamentEvent(tournamentId, "DuelStarted", null, {
    duelId: match.id, engineMatchId: engineMatch.id,
    playerA: match.slotA.playerId, playerB: match.slotB.playerId,
    roundName: match.roundName,
  });
  log.info("duel.started", { tournamentId, duelId: match.id, engineMatchId: engineMatch.id });

  const duel: DuelResult = {
    duelId: match.id,
    engineMatchId: engineMatch.id,
    playerAId: match.slotA.playerId,
    playerBId: match.slotB.playerId,
    winnerId: null,
    loserId: null,
    scoreA: 0,
    scoreB: 0,
    correctA: 0,
    correctB: 0,
    avgSpeedMsA: 0,
    avgSpeedMsB: 0,
    endReason: "",
    lossReason: null,
    startedAt: match.startedAt,
    finishedAt: "",
    durationMs: 0,
  };
  t.duels.push(duel);
  return duel;
}

export function recordDuelResult(tournamentId: string, matchId: string, result: Partial<DuelResult>): DuelResult | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;
  const match = b.matches.find(m => m.id === matchId);
  if (!match) return null;
  const duel = t.duels.find(d => d.duelId === matchId);
  if (!duel) return null;

  const now = new Date().toISOString();
  Object.assign(duel, result);
  duel.finishedAt = now;
  duel.durationMs = Date.parse(now) - Date.parse(duel.startedAt);
  if (!duel.endReason) duel.endReason = "normal";

  match.status = "completed";
  match.winnerId = duel.winnerId;
  match.loserId = duel.loserId;
  match.finishedAt = now;

  emitTournamentEvent(tournamentId, "DuelCompleted", duel.winnerId, {
    duelId: matchId, winnerId: duel.winnerId, loserId: duel.loserId,
    scoreA: duel.scoreA, scoreB: duel.scoreB, lossReason: duel.lossReason,
  });
  log.info("duel.completed", { tournamentId, duelId: matchId, winnerId: duel.winnerId });
  return duel;
}

export function getDuel(tournamentId: string, duelId: string): DuelResult | null {
  return tournaments.get(tournamentId)?.duels.find(d => d.duelId === duelId) ?? null;
}

export function listDuels(tournamentId: string): DuelResult[] {
  return tournaments.get(tournamentId)?.duels ?? [];
}

// ===========================================================================
// System 5 — Advancement Engine
// ===========================================================================

export function advanceWinner(tournamentId: string, matchId: string): AdvancementEvent | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;
  const match = b.matches.find(m => m.id === matchId);
  if (!match || !match.winnerId) return null;

  // Find next-round slot via visual.nextSlotId
  const nextSlotId = match.visual.nextSlotId;
  if (!nextSlotId) {
    // This is the final — champion decided
    return crownChampion(tournamentId, match.winnerId, match.loserId);
  }
  const nextSlot = b.slots.find(s => s.id === nextSlotId);
  if (!nextSlot) return null;

  // Place winner in next slot
  nextSlot.playerId = match.winnerId;
  nextSlot.playerDisplayName = match.slotA.playerId === match.winnerId
    ? match.slotA.playerDisplayName
    : match.slotB.playerDisplayName;
  nextSlot.seed = match.slotA.playerId === match.winnerId ? match.slotA.seed : match.slotB.seed;
  match.slotA.advancedToSlotId = match.slotA.playerId === match.winnerId ? nextSlotId : null;
  match.slotB.advancedToSlotId = match.slotB.playerId === match.winnerId ? nextSlotId : null;

  // If next slot's opponent is a bye, advance automatically
  const nextMatch = b.matches.find(m => m.slotA.id === nextSlotId || m.slotB.id === nextSlotId);
  if (nextMatch) {
    const opponentSlot = nextMatch.slotA.id === nextSlotId ? nextMatch.slotB : nextMatch.slotA;
    if (opponentSlot.isBye) {
      // Auto-advance via bye
      assignBye(tournamentId, opponentSlot.id, opponentSlot.roundIndex, "walkover_no_opponent");
      const byeAdv = advanceBye(tournamentId, nextMatch.id, nextSlot.playerId!);
      if (byeAdv) recordAdvancement(tournamentId, byeAdv);
    }
  }

  const event = recordAdvancement(tournamentId, {
    id: randomUUID(),
    tournamentId,
    kind: "advanced",
    roundIndex: match.roundIndex,
    fromSlotId: match.slotA.playerId === match.winnerId ? match.slotA.id : match.slotB.id,
    toSlotId: nextSlotId,
    playerId: match.winnerId,
    timestamp: new Date().toISOString(),
    metadata: { roundName: match.roundName },
  });
  t.phase = "advancement";
  return event;
}

function recordAdvancement(tournamentId: string, evt: AdvancementEvent): AdvancementEvent {
  const t = tournaments.get(tournamentId);
  if (t) {
    t.advancementEvents.push(evt);
    t.phase = "bracket_update";
    emitTournamentEvent(tournamentId, "PlayerAdvanced", evt.playerId, {
      kind: evt.kind, fromSlotId: evt.fromSlotId, toSlotId: evt.toSlotId, roundIndex: evt.roundIndex,
    });
  }
  return evt;
}

export function getAdvancementEvents(tournamentId: string): AdvancementEvent[] {
  return tournaments.get(tournamentId)?.advancementEvents ?? [];
}

// ===========================================================================
// System 6 — Bye Engine
// ===========================================================================

export function assignBye(tournamentId: string, slotId: string, roundIndex: number, reason: ByeAssignment["reason"]): ByeAssignment | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const bye: ByeAssignment = {
    slotId, playerId: "", roundIndex, reason,
    advancedToSlotId: null,
    timestamp: new Date().toISOString(),
  };
  t.byes.push(bye);
  emitTournamentEvent(tournamentId, "ByeAssigned", null, { slotId, roundIndex, reason });
  log.info("bye.assigned", { tournamentId, slotId, roundIndex, reason });
  return bye;
}

/**
 * When a player gets a bye, they advance to the next round without playing.
 * This is used in the first round when player count < bracket size, and
 * when a walkover leaves one player without an opponent.
 */
export function advanceBye(tournamentId: string, matchId: string, advancingPlayerId: string): AdvancementEvent | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;
  const match = b.matches.find(m => m.id === matchId);
  if (!match) return null;

  // Mark match as walkover
  match.status = "walkover";
  match.winnerId = advancingPlayerId;
  match.finishedAt = new Date().toISOString();

  // Find which slot has the advancing player
  const advancingSlot = match.slotA.playerId === advancingPlayerId ? match.slotA : match.slotB;
  const nextSlotId = match.visual.nextSlotId;
  if (nextSlotId) {
    const nextSlot = b.slots.find(s => s.id === nextSlotId);
    if (nextSlot) {
      nextSlot.playerId = advancingPlayerId;
      nextSlot.playerDisplayName = advancingSlot.playerDisplayName;
      nextSlot.seed = advancingSlot.seed;
      advancingSlot.advancedToSlotId = nextSlotId;
      // Update bye record
      const bye = t.byes.find(b => b.slotId === advancingSlot.id);
      if (bye) bye.advancedToSlotId = nextSlotId;
    }
  }

  return recordAdvancement(tournamentId, {
    id: randomUUID(),
    tournamentId,
    kind: "byes_assigned",
    roundIndex: match.roundIndex,
    fromSlotId: advancingSlot.id,
    toSlotId: nextSlotId,
    playerId: advancingPlayerId,
    timestamp: new Date().toISOString(),
    metadata: { reason: "bye" },
  });
}

export function getByes(tournamentId: string): ByeAssignment[] {
  return tournaments.get(tournamentId)?.byes ?? [];
}

// ===========================================================================
// System 7 — Walkover Engine
// ===========================================================================

export function recordWalkover(tournamentId: string, matchId: string, absentPlayerId: string, reason: WalkoverReason, auditNote: string): WalkoverRecord | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;
  const match = b.matches.find(m => m.id === matchId);
  if (!match) return null;

  const advancingPlayerId = match.slotA.playerId === absentPlayerId
    ? match.slotB.playerId
    : match.slotA.playerId;
  if (!advancingPlayerId) return null;

  const record: WalkoverRecord = {
    id: randomUUID(),
    tournamentId,
    duelId: matchId,
    absentPlayerId,
    advancingPlayerId,
    reason,
    auditNote,
    timestamp: new Date().toISOString(),
  };
  t.walkovers.push(record);

  // Mark duel as walkover
  match.status = "walkover";
  match.winnerId = advancingPlayerId;
  match.loserId = absentPlayerId;
  match.finishedAt = record.timestamp;

  // Record duel result
  const duel = t.duels.find(d => d.duelId === matchId);
  if (duel) {
    duel.winnerId = advancingPlayerId;
    duel.loserId = absentPlayerId;
    duel.endReason = "walkover";
    duel.lossReason = reason === "absent" || reason === "no_show" ? "no_show" : reason === "disconnect_timeout" ? "disconnected" : reason === "forfeit" ? "forfeit" : reason === "teacher_removed" ? "teacher_removed" : "no_show";
    duel.finishedAt = record.timestamp;
  }

  emitTournamentEvent(tournamentId, "WalkoverRecorded", absentPlayerId, {
    duelId: matchId, absentPlayerId, advancingPlayerId, reason, auditNote,
  });
  log.info("walkover.recorded", { tournamentId, matchId, absentPlayerId, advancingPlayerId, reason });

  // Auto-advance the non-absent player
  advanceWinner(tournamentId, matchId);

  return record;
}

export function getWalkovers(tournamentId: string): WalkoverRecord[] {
  return tournaments.get(tournamentId)?.walkovers ?? [];
}

// ===========================================================================
// System 8 — Tie Resolution Engine
// ===========================================================================

export function resolveTie(tournamentId: string, duelId: string, opts: {
  strategy?: TieResolutionStrategy;
  avgSpeedMsA?: number;
  avgSpeedMsB?: number;
  teacherId?: string;
  teacherDecision?: string;
}): TieResolutionResult | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const duel = t.duels.find(d => d.duelId === duelId);
  if (!duel) return null;
  const strategy = opts.strategy ?? t.rules.tieResolution;
  let winnerId = "";
  let explanation = "";
  let loserId = "";
  const A = duel.playerAId;
  const B = duel.playerBId;

  switch (strategy) {
    case "fastest_response": {
      const speedA = opts.avgSpeedMsA ?? duel.avgSpeedMsA;
      const speedB = opts.avgSpeedMsB ?? duel.avgSpeedMsB;
      if (speedA < speedB) { winnerId = A; loserId = B; } else { winnerId = B; loserId = A; }
      explanation = `Player responded faster (avg ${Math.min(speedA, speedB)}ms vs ${Math.max(speedA, speedB)}ms)`;
      break;
    }
    case "sudden_death":
      // Sudden death is a single extra question; for simulation, fastest response wins
      winnerId = (opts.avgSpeedMsA ?? duel.avgSpeedMsA) <= (opts.avgSpeedMsB ?? duel.avgSpeedMsB) ? A : B;
      loserId = winnerId === A ? B : A;
      explanation = "Sudden death: fastest single response";
      break;
    case "extra_question":
      winnerId = (duel.scoreA >= duel.scoreB) ? A : B;
      loserId = winnerId === A ? B : A;
      explanation = "Extra question awarded to higher base score";
      break;
    case "teacher_decision":
      if (!opts.teacherId || !opts.teacherDecision) return null;
      winnerId = opts.teacherDecision;
      loserId = winnerId === A ? B : A;
      explanation = `Teacher ${opts.teacherId} decided winner`;
      break;
  }

  const result: TieResolutionResult = {
    duelId,
    strategy,
    winnerId,
    loserId,
    explanation,
    decidedBy: opts.teacherId ?? null,
    timestamp: new Date().toISOString(),
  };
  t.tieResolutions.push(result);
  duel.winnerId = winnerId;
  duel.loserId = loserId;
  duel.lossReason = "tie_breaker_loss";

  emitTournamentEvent(tournamentId, "TieResolved", winnerId, {
    duelId, strategy, winnerId, loserId, explanation,
  });
  log.info("tie.resolved", { tournamentId, duelId, strategy, winnerId });
  return result;
}

export function getTieResolutions(tournamentId: string): TieResolutionResult[] {
  return tournaments.get(tournamentId)?.tieResolutions ?? [];
}

// ===========================================================================
// System 9 — Championship Engine
// ===========================================================================

export function crownChampion(tournamentId: string, championId: string, runnerUpId: string | null): AdvancementEvent | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;

  // Find champion slot
  const championSlot = b.slots.find(s => s.playerId === championId && s.roundName === "final");
  const runnerUpSlot = runnerUpId ? b.slots.find(s => s.playerId === runnerUpId && s.roundName === "final") : null;
  if (championSlot) b.championSlotId = championSlot.id;
  if (runnerUpSlot) b.runnerUpSlotId = runnerUpSlot.id;

  t.championship.stage = "champion_crowned";
  t.championship.championId = championId;
  t.championship.championDisplayName = championSlot?.playerDisplayName ?? null;
  t.championship.runnerUpId = runnerUpId;
  t.championship.runnerUpDisplayName = runnerUpSlot?.playerDisplayName ?? null;
  t.championship.crownedAt = new Date().toISOString();
  t.championship.finalistCount = 2;

  const celebration: CelebrationEvent = {
    id: randomUUID(),
    kind: "champion_crowned",
    playerId: championId,
    displayName: championSlot?.playerDisplayName ?? championId,
    timestamp: t.championship.crownedAt,
    payload: { runnerUpId },
  };
  t.championship.celebrationEvents.push(celebration);

  emitTournamentEvent(tournamentId, "ChampionCrowned", championId, {
    championId, runnerUpId, championDisplayName: championSlot?.playerDisplayName,
  });
  log.info("champion.crowned", { tournamentId, championId });

  return recordAdvancement(tournamentId, {
    id: randomUUID(),
    tournamentId,
    kind: "champion_decided",
    roundIndex: b.rounds - 1,
    fromSlotId: championSlot?.id ?? null,
    toSlotId: null,
    playerId: championId,
    timestamp: t.championship.crownedAt,
    metadata: { champion: true },
  });
}

export function recordBronze(tournamentId: string, bronzeWinnerId: string, bronzeLoserId: string): AdvancementEvent | null {
  const t = tournaments.get(tournamentId);
  if (!t) return null;
  const b = t.bracket;
  if (!b) return null;
  const bronzeSlot = b.slots.find(s => s.playerId === bronzeWinnerId);
  if (bronzeSlot) b.bronzeSlotId = bronzeSlot.id;
  t.championship.bronzeId = bronzeWinnerId;
  t.championship.bronzeDisplayName = bronzeSlot?.playerDisplayName ?? null;
  t.championship.stage = "tournament_complete";

  const celebration: CelebrationEvent = {
    id: randomUUID(),
    kind: "bronze_decided",
    playerId: bronzeWinnerId,
    displayName: bronzeSlot?.playerDisplayName ?? bronzeWinnerId,
    timestamp: new Date().toISOString(),
    payload: { bronzeLoserId },
  };
  t.championship.celebrationEvents.push(celebration);

  emitTournamentEvent(tournamentId, "BronzeDecided", bronzeWinnerId, { bronzeWinnerId, bronzeLoserId });
  return recordAdvancement(tournamentId, {
    id: randomUUID(),
    tournamentId,
    kind: "bronze_decided",
    roundIndex: b.rounds,
    fromSlotId: bronzeSlot?.id ?? null,
    toSlotId: null,
    playerId: bronzeWinnerId,
    timestamp: new Date().toISOString(),
    metadata: { bronze: true },
  });
}

export function completeTournament(tournamentId: string): boolean {
  const t = tournaments.get(tournamentId);
  if (!t) return false;
  t.phase = "champion_ceremony";
  t.finishedAt = new Date().toISOString();
  t.championship.stage = "tournament_complete";
  emitTournamentEvent(tournamentId, "TournamentCompleted", null, {
    championId: t.championship.championId,
    durationMs: t.startedAt ? Date.parse(t.finishedAt) - Date.parse(t.startedAt) : 0,
  });
  log.info("tournament.completed", { tournamentId, championId: t.championship.championId });
  return true;
}

export function getChampionship(tournamentId: string): ChampionshipState | null {
  return tournaments.get(tournamentId)?.championship ?? null;
}

// ===========================================================================
// Tournament Event Bus helper — emits to the engine Event Bus
// ===========================================================================

/**
 * Maps tournament-specific event names to the engine's GameEventType values.
 * This is required because the engine's emitEvent() accepts only GameEventType
 * (a fixed union). We reuse the closest-matching engine event type and store
 * the tournament-specific name in the payload's `kind` field, so subscribers
 * can filter by both engine event type AND tournament event kind.
 *
 * This is the same pattern other game modes use (Quiz Royale emits
 * "ScoreUpdated" with action:"lose_life" in the payload).
 */
const TOURNAMENT_EVENT_MAP: Record<string, string> = {
  TournamentCreated: "MatchCreated",
  PlayerRegistered: "PlayerJoined",
  BracketGenerated: "StateTransition",
  SeedingCompleted: "StateTransition",
  DuelStarted: "RoundStarted",
  DuelCompleted: "RoundFinished",
  PlayerAdvanced: "StateTransition",
  ChampionCrowned: "MatchFinished",
  BronzeDecided: "MatchFinished",
  TournamentCompleted: "MatchFinished",
  WalkoverRecorded: "PlayerLeft",
  TieResolved: "ScoreUpdated",
  ByeAssigned: "StateTransition",
  TournamentStarted: "MatchCreated",
  TournamentPhaseChanged: "StateTransition",
};

function emitTournamentEvent(tournamentId: string, type: string, userId: string | null, payload: Record<string, unknown>): void {
  // Reuse the engine's emitEvent so all tournament events flow through the
  // same Event Bus that the engine uses for matches. The tournamentId is
  // used as the "matchId" channel so subscribers can filter by tournament.
  const engineType = TOURNAMENT_EVENT_MAP[type] ?? "StateTransition";
  emitEvent(tournamentId, engineType as Parameters<typeof emitEvent>[1], userId, {
    tournamentId,
    kind: type, // preserve the tournament-specific event name in the payload
    ...payload,
  });
}
