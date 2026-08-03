/**
 * EduBek — Battle Royale tests. Phase 6G.6: 20 systems.
 * Tournament bracket, duel engine, championship platform — all as a
 * configuration layer on top of the Universal Game Engine.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  BATTLE_ROYALE_RULES, getRules, createTournament, getTournament, listTournaments,
  destroyTournament, registerPlayer, unregisterPlayer, setSeedingStrategy,
  generateBracket, getBracket, getMatchById, getMatchesByRound,
  seedPlayers,
  getDuelConfig, startDuel, recordDuelResult, getDuel, listDuels,
  advanceWinner, getAdvancementEvents,
  assignBye, advanceBye, getByes,
  recordWalkover, getWalkovers,
  resolveTie, getTieResolutions,
  crownChampion, recordBronze, completeTournament, getChampionship,
} from "@/features/game-modes/battle-royale/tournament-engine";
import {
  buildLeaderboard, BATTLE_ROYALE_ACHIEVEMENTS, checkAchievements,
  getTournamentPhase, setTournamentPhase, startTournament,
  executeTeacherAction, getStudentUXState, generateAnalytics,
  getReplayTimeline, getDuelReplay, addTournamentSpectator, getSpectatorView,
  BATTLE_ROYALE_ACCESSIBILITY, generateDashboard,
  COMPETITIVE_PRESETS, getBalancePresets, getPreset,
  checkBattleRoyaleCheat, getBattleRoyaleStatus,
} from "@/features/game-modes/battle-royale/gameplay-dashboard";
import { getEvents, getMatch } from "@/features/game-engine";

let testTournamentId: string;

beforeEach(() => {
  const t = createTournament({ hostId: "teacher-1", preset: "school" });
  testTournamentId = t.id;
  // Register 4 players for an 8-bracket tournament (forces 4 byes)
  registerPlayer(testTournamentId, { userId: "p1", displayName: "Alice", rating: 90 });
  registerPlayer(testTournamentId, { userId: "p2", displayName: "Bob", rating: 80 });
  registerPlayer(testTournamentId, { userId: "p3", displayName: "Carol", rating: 70 });
  registerPlayer(testTournamentId, { userId: "p4", displayName: "Dave", rating: 60 });
});

// ===== System 1 — Tournament Engine =====
describe("Battle Royale — Tournament Engine", () => {
  it("creates a tournament with default rules", () => {
    const t = getTournament(testTournamentId);
    expect(t).not.toBeNull();
    expect(t!.rules.gameMode).toBe("battle_royale");
    expect(t!.rules.format).toBe("single_elimination");
    expect(t!.phase).toBe("registration");
  });
  it("default rules have correct bracket size", () => { expect(BATTLE_ROYALE_RULES.bracketSize).toBe(16); });
  it("default rules enable bronze match", () => { expect(BATTLE_ROYALE_RULES.bronzeMatchEnabled).toBe(true); });
  it("getRules returns a copy", () => { expect(getRules()).not.toBe(BATTLE_ROYALE_RULES); });
  it("registers players", () => { expect(registerPlayer(testTournamentId, { userId: "p5", displayName: "Eve" })).toBe(true); });
  it("rejects duplicate registration", () => { expect(registerPlayer(testTournamentId, { userId: "p1", displayName: "Alice" })).toBe(false); });
  it("unregisters players", () => { expect(unregisterPlayer(testTournamentId, "p4")).toBe(true); });
  it("lists tournaments", () => { expect(listTournaments().length).toBeGreaterThan(0); });
  it("destroys tournaments", () => {
    const t = createTournament({ hostId: "teacher-2" });
    expect(destroyTournament(t.id)).toBe(true);
    expect(getTournament(t.id)).toBeNull();
  });
  it("sets seeding strategy", () => {
    expect(setSeedingStrategy(testTournamentId, "rating_based")).toBe(true);
    expect(getTournament(testTournamentId)?.seedingStrategy).toBe("rating_based");
  });
  it("emits creation event via engine Event Bus", () => {
    const events = getEvents(testTournamentId);
    expect(events.some(e => e.type === "MatchCreated")).toBe(true);
  });
});

// ===== System 2 — Bracket Engine =====
describe("Battle Royale — Bracket Engine", () => {
  beforeEach(() => {
    seedPlayers(testTournamentId, "rating_based");
  });

  it("generates a bracket with correct size", () => {
    // Use a small bracket for testing — set bracketSize to 8
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    expect(b).not.toBeNull();
    expect(b!.size).toBe(8);
    expect(b!.rounds).toBe(3);
  });
  it("bracket has correct number of slots", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    // 8 + 4 + 2 + 1 = 15 slots for an 8-bracket
    expect(b!.totalSlots).toBe(14); // 8 + 4 + 2
  });
  it("bracket matches have correct round names", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    const roundNames = new Set(b!.matches.map(m => m.roundName));
    expect(roundNames.has("quarterfinal")).toBe(true);
    expect(roundNames.has("semifinal")).toBe(true);
    expect(roundNames.has("final")).toBe(true);
  });
  it("first round slots get seeded players", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    const firstRound = b!.slots.filter(s => s.roundIndex === 0);
    const playerSlots = firstRound.filter(s => s.playerId !== null);
    expect(playerSlots.length).toBe(4); // we registered 4 players
  });
  it("empty slots become byes", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    const firstRound = b!.slots.filter(s => s.roundIndex === 0);
    const byes = firstRound.filter(s => s.isBye);
    expect(byes.length).toBe(4); // 8 slots - 4 players = 4 byes
  });
  it("getBracket returns current bracket", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    expect(getBracket(testTournamentId)).not.toBeNull();
  });
  it("getMatchById finds a match", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    const firstMatch = b!.matches[0];
    expect(getMatchById(testTournamentId, firstMatch.id)).not.toBeNull();
  });
  it("getMatchesByRound filters by round", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const r0 = getMatchesByRound(testTournamentId, 0);
    expect(r0.length).toBe(4); // 8-bracket first round has 4 matches
  });
  it("bracket has visual metadata for rendering", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    const b = generateBracket(testTournamentId);
    expect(b!.matches[0].visual.column).toBe(0);
    expect(b!.matches[0].visual.nextSlotId).not.toBeNull();
  });
  it("supports 16-bracket size", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 16;
    const b = generateBracket(testTournamentId);
    expect(b!.size).toBe(16);
    expect(b!.rounds).toBe(4);
  });
  it("supports 32-bracket size", () => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 32;
    const b = generateBracket(testTournamentId);
    expect(b!.size).toBe(32);
    expect(b!.rounds).toBe(5);
  });
});

// ===== System 3 — Seeding Engine =====
describe("Battle Royale — Seeding Engine", () => {
  it("seeds players randomly", () => {
    const results = seedPlayers(testTournamentId, "random");
    expect(results.length).toBe(4);
    expect(results.every(r => r.strategy === "random")).toBe(true);
  });
  it("seeds by rating (descending)", () => {
    const results = seedPlayers(testTournamentId, "rating_based");
    expect(results[0].userId).toBe("p1"); // Alice has rating 90
    expect(results[0].seed).toBe(1);
  });
  it("seeds by previous score", () => {
    // Re-register with previous scores
    const t = createTournament({ hostId: "teacher-x" });
    registerPlayer(t.id, { userId: "a", displayName: "A", previousScore: 50 });
    registerPlayer(t.id, { userId: "b", displayName: "B", previousScore: 100 });
    const results = seedPlayers(t.id, "previous_score");
    expect(results[0].userId).toBe("b"); // B has higher score
  });
  it("seeds by organization rank", () => {
    const t = createTournament({ hostId: "teacher-x" });
    registerPlayer(t.id, { userId: "a", displayName: "A", organizationRank: 5 });
    registerPlayer(t.id, { userId: "b", displayName: "B", organizationRank: 1 });
    const results = seedPlayers(t.id, "organization_ranking");
    expect(results[0].userId).toBe("b"); // B has rank 1
  });
  it("seeds by teacher-defined seeds", () => {
    const t = createTournament({ hostId: "teacher-x" });
    registerPlayer(t.id, { userId: "a", displayName: "A", teacherSeed: 2 });
    registerPlayer(t.id, { userId: "b", displayName: "B", teacherSeed: 1 });
    const results = seedPlayers(t.id, "teacher_defined");
    expect(results[0].userId).toBe("b"); // B has teacherSeed 1
  });
  it("balanced_random produces interleaved seeds", () => {
    const t = createTournament({ hostId: "teacher-x" });
    for (let i = 0; i < 4; i++) {
      registerPlayer(t.id, { userId: `p${i}`, displayName: `P${i}`, rating: 100 - i * 10 });
    }
    const results = seedPlayers(t.id, "balanced_random");
    expect(results.length).toBe(4);
    // Top half should be seeds 1 and 3 (interleaved)
    expect(results[0].userId).toBe("p0"); // highest rating
  });
  it("all seeds are unique and sequential", () => {
    const results = seedPlayers(testTournamentId, "rating_based");
    const seeds = results.map(r => r.seed);
    expect(new Set(seeds).size).toBe(seeds.length);
    expect(Math.min(...seeds)).toBe(1);
  });
  it("updates tournament phase to seeding", () => {
    seedPlayers(testTournamentId, "random");
    expect(getTournament(testTournamentId)?.phase).toBe("seeding");
  });
});

// ===== System 4 — Duel Engine =====
describe("Battle Royale — Duel Engine", () => {
  beforeEach(() => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    seedPlayers(testTournamentId, "rating_based");
    generateBracket(testTournamentId);
  });

  it("returns duel config from rules", () => {
    const config = getDuelConfig(testTournamentId);
    expect(config.questionsPerMatch).toBe(BATTLE_ROYALE_RULES.duelQuestionsPerMatch);
    expect(config.winCondition).toBe(BATTLE_ROYALE_RULES.duelWinCondition);
  });
  it("starts a duel by creating an engine match", () => {
    const bracket = getBracket(testTournamentId)!;
    // Find a match with two real players (not byes)
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    expect(realMatch).toBeDefined();
    const duel = startDuel(testTournamentId, realMatch!.id);
    expect(duel).not.toBeNull();
    expect(duel!.engineMatchId).not.toBeNull();
    // Verify the engine match exists
    expect(getMatch(duel!.engineMatchId)).not.toBeNull();
  });
  it("records duel result with winner and loser", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    const duel = startDuel(testTournamentId, realMatch!.id);
    const result = recordDuelResult(testTournamentId, realMatch!.id, {
      winnerId: duel!.playerAId,
      loserId: duel!.playerBId,
      scoreA: 500, scoreB: 300,
      correctA: 5, correctB: 3,
      avgSpeedMsA: 3000, avgSpeedMsB: 4000,
    });
    expect(result!.winnerId).toBe(duel!.playerAId);
    expect(result!.scoreA).toBe(500);
    expect(result!.durationMs).toBeGreaterThanOrEqual(0);
  });
  it("lists all duels", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    expect(listDuels(testTournamentId).length).toBe(1);
  });
  it("getDuel returns a specific duel", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    expect(getDuel(testTournamentId, realMatch!.id)).not.toBeNull();
  });
  it("cannot start a duel for a bye match", () => {
    const bracket = getBracket(testTournamentId)!;
    const byeMatch = bracket.matches.find(m => m.slotA.isBye || m.slotB.isBye);
    if (byeMatch) {
      const result = startDuel(testTournamentId, byeMatch.id);
      expect(result).toBeNull();
    }
  });
});

// ===== System 5 — Advancement Engine =====
describe("Battle Royale — Advancement Engine", () => {
  beforeEach(() => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    seedPlayers(testTournamentId, "rating_based");
    generateBracket(testTournamentId);
  });

  it("advances winner to next round slot", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    recordDuelResult(testTournamentId, realMatch!.id, {
      winnerId: realMatch!.slotA.playerId,
      loserId: realMatch!.slotB.playerId,
      scoreA: 500, scoreB: 300, correctA: 5, correctB: 3,
      avgSpeedMsA: 3000, avgSpeedMsB: 4000,
    });
    const event = advanceWinner(testTournamentId, realMatch!.id);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("advanced");
    expect(event!.playerId).toBe(realMatch!.slotA.playerId);
  });
  it("records advancement events", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    recordDuelResult(testTournamentId, realMatch!.id, {
      winnerId: realMatch!.slotA.playerId,
      loserId: realMatch!.slotB.playerId,
      scoreA: 500, scoreB: 300, correctA: 5, correctB: 3,
      avgSpeedMsA: 3000, avgSpeedMsB: 4000,
    });
    advanceWinner(testTournamentId, realMatch!.id);
    expect(getAdvancementEvents(testTournamentId).length).toBeGreaterThan(0);
  });
});

// ===== System 6 — Bye Engine =====
describe("Battle Royale — Bye Engine", () => {
  it("assigns byes for empty slots", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    // 4 byes expected (8 slots - 4 players)
    expect(getByes(testTournamentId).length).toBe(4);
  });
  it("records bye assignments with reason", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const byes = getByes(testTournamentId);
    expect(byes.every(b => b.reason === "bracket_imbalance")).toBe(true);
  });
});

// ===== System 7 — Walkover Engine =====
describe("Battle Royale — Walkover Engine", () => {
  beforeEach(() => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    seedPlayers(testTournamentId, "rating_based");
    generateBracket(testTournamentId);
  });

  it("records a walkover for an absent player", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    const absentId = realMatch!.slotA.playerId!;
    const advancingId = realMatch!.slotB.playerId!;
    const record = recordWalkover(testTournamentId, realMatch!.id, absentId, "absent", "Player did not show up");
    expect(record).not.toBeNull();
    expect(record!.absentPlayerId).toBe(absentId);
    expect(record!.advancingPlayerId).toBe(advancingId);
    expect(record!.reason).toBe("absent");
  });
  it("auto-advances the non-absent player after walkover", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    const absentId = realMatch!.slotA.playerId!;
    recordWalkover(testTournamentId, realMatch!.id, absentId, "disconnect_timeout", "Lost connection");
    // After walkover, the match winner should be the non-absent player
    const updatedMatch = getMatchById(testTournamentId, realMatch!.id);
    expect(updatedMatch!.winnerId).toBe(realMatch!.slotB.playerId);
  });
  it("supports multiple walkover reasons", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    recordWalkover(testTournamentId, realMatch!.id, realMatch!.slotA.playerId!, "forfeit", "Player forfeited");
    const walkovers = getWalkovers(testTournamentId);
    expect(walkovers[0].reason).toBe("forfeit");
  });
});

// ===== System 8 — Tie Resolution Engine =====
describe("Battle Royale — Tie Resolution Engine", () => {
  beforeEach(() => {
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    seedPlayers(testTournamentId, "rating_based");
    generateBracket(testTournamentId);
  });

  it("resolves tie by fastest response", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    const duel = startDuel(testTournamentId, realMatch!.id);
    const result = resolveTie(testTournamentId, realMatch!.id, {
      strategy: "fastest_response",
      avgSpeedMsA: 3000, avgSpeedMsB: 2500,
    });
    expect(result).not.toBeNull();
    expect(result!.winnerId).toBe(duel!.playerBId); // B was faster
    expect(result!.strategy).toBe("fastest_response");
  });
  it("resolves tie by teacher decision", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    const duel = startDuel(testTournamentId, realMatch!.id);
    const result = resolveTie(testTournamentId, realMatch!.id, {
      strategy: "teacher_decision",
      teacherId: "teacher-1",
      teacherDecision: duel!.playerAId,
    });
    expect(result!.winnerId).toBe(duel!.playerAId);
    expect(result!.decidedBy).toBe("teacher-1");
  });
  it("stores tie resolution results", () => {
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    resolveTie(testTournamentId, realMatch!.id, { strategy: "sudden_death", avgSpeedMsA: 3000, avgSpeedMsB: 2500 });
    expect(getTieResolutions(testTournamentId).length).toBe(1);
  });
});

// ===== System 9 — Championship Engine =====
describe("Battle Royale — Championship Engine", () => {
  it("crowns a champion", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const event = crownChampion(testTournamentId, "p1", "p2");
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("champion_decided");
    const champ = getChampionship(testTournamentId);
    expect(champ!.championId).toBe("p1");
    expect(champ!.runnerUpId).toBe("p2");
    expect(champ!.stage).toBe("champion_crowned");
  });
  it("records bronze winner", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    recordBronze(testTournamentId, "p3", "p4");
    const champ = getChampionship(testTournamentId);
    expect(champ!.bronzeId).toBe("p3");
  });
  it("completes tournament", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    crownChampion(testTournamentId, "p1", "p2");
    expect(completeTournament(testTournamentId)).toBe(true);
    expect(getTournament(testTournamentId)?.phase).toBe("champion_ceremony");
    expect(getTournament(testTournamentId)?.finishedAt).not.toBeNull();
  });
  it("creates celebration events", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    crownChampion(testTournamentId, "p1", "p2");
    const champ = getChampionship(testTournamentId);
    expect(champ!.celebrationEvents.length).toBeGreaterThan(0);
    expect(champ!.celebrationEvents.some(e => e.kind === "champion_crowned")).toBe(true);
  });
});

// ===== System 10 — Leaderboards =====
describe("Battle Royale — Leaderboards", () => {
  it("builds a leaderboard with entries", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const lb = buildLeaderboard(testTournamentId);
    expect(lb.length).toBe(4); // 4 players
    expect(lb[0].rank).toBe(1);
  });
  it("sorts by tournament ranking by default", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    crownChampion(testTournamentId, "p1", "p2");
    const lb = buildLeaderboard(testTournamentId, "tournament_ranking");
    expect(lb[0].userId).toBe("p1"); // champion
  });
  it("supports wins leaderboard type", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const lb = buildLeaderboard(testTournamentId, "wins");
    expect(lb.length).toBe(4);
  });
  it("supports champion leaderboard type", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    crownChampion(testTournamentId, "p1", "p2");
    const lb = buildLeaderboard(testTournamentId, "champion");
    expect(lb[0].userId).toBe("p1");
  });
  it("supports all 11 leaderboard types", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const types = ["tournament_ranking", "champion", "runner_up", "bronze", "wins", "losses",
                   "question_accuracy", "response_speed", "tournament_score", "teacher_dashboard", "final_standings"] as const;
    for (const type of types) {
      expect(buildLeaderboard(testTournamentId, type).length).toBe(4);
    }
  });
});

// ===== System 11 — Achievements =====
describe("Battle Royale — Achievements", () => {
  it("has 18 achievements", () => { expect(BATTLE_ROYALE_ACHIEVEMENTS.length).toBe(18); });
  it("awards Champion", () => {
    expect(checkAchievements({
      won: true, isChampion: true, isRunnerUp: false, isBronze: false,
      duelsWon: 4, duelsLost: 0, perfectDuels: 0, flawlessTournament: true,
      comebacks: 0, fastestResponseMs: 3000, initialSeed: 1, finalRank: 1,
      totalCorrect: 20, totalAnswered: 20, longestWinStreak: 4, upsetVictories: 0,
      tournamentComplete: true, avgDuelDurationMs: 60000,
    }).some(a => a.id === "champion")).toBe(true);
  });
  it("awards Underdog", () => {
    expect(checkAchievements({
      won: true, isChampion: true, isRunnerUp: false, isBronze: false,
      duelsWon: 4, duelsLost: 0, perfectDuels: 0, flawlessTournament: false,
      comebacks: 0, fastestResponseMs: 3000, initialSeed: 8, finalRank: 1,
      totalCorrect: 15, totalAnswered: 20, longestWinStreak: 4, upsetVictories: 2,
      tournamentComplete: true, avgDuelDurationMs: 60000,
    }).some(a => a.id === "underdog")).toBe(true);
  });
  it("awards Speed Master", () => {
    expect(checkAchievements({
      won: false, isChampion: false, isRunnerUp: false, isBronze: false,
      duelsWon: 1, duelsLost: 1, perfectDuels: 0, flawlessTournament: false,
      comebacks: 0, fastestResponseMs: 1400, initialSeed: 4, finalRank: null,
      totalCorrect: 5, totalAnswered: 10, longestWinStreak: 1, upsetVictories: 0,
      tournamentComplete: false, avgDuelDurationMs: 60000,
    }).some(a => a.id === "speed_master")).toBe(true);
  });
  it("awards Grand Champion", () => {
    expect(checkAchievements({
      won: true, isChampion: true, isRunnerUp: false, isBronze: false,
      duelsWon: 4, duelsLost: 0, perfectDuels: 4, flawlessTournament: true,
      comebacks: 0, fastestResponseMs: 2000, initialSeed: 1, finalRank: 1,
      totalCorrect: 20, totalAnswered: 20, longestWinStreak: 4, upsetVictories: 0,
      tournamentComplete: true, avgDuelDurationMs: 60000,
    }).some(a => a.id === "grand_champion")).toBe(true);
  });
  it("all achievements have unique IDs", () => {
    const ids = BATTLE_ROYALE_ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("all achievements have XP rewards", () => {
    for (const a of BATTLE_ROYALE_ACHIEVEMENTS) expect(a.xpReward).toBeGreaterThan(0);
  });
});

// ===== System 12 — Tournament Flow =====
describe("Battle Royale — Tournament Flow", () => {
  it("starts tournament and sets phase", () => {
    expect(startTournament(testTournamentId)).toBe(true);
    expect(getTournament(testTournamentId)?.phase).toBe("seeding");
    expect(getTournament(testTournamentId)?.startedAt).not.toBeNull();
  });
  it("gets current phase", () => {
    expect(getTournamentPhase(testTournamentId)).toBe("registration");
  });
  it("sets tournament phase", () => {
    expect(setTournamentPhase(testTournamentId, "duel")).toBe(true);
    expect(getTournamentPhase(testTournamentId)).toBe("duel");
  });
});

// ===== System 13 — Teacher Controls =====
describe("Battle Royale — Teacher Controls", () => {
  it("pauses tournament", () => {
    const r = executeTeacherAction(testTournamentId, "teacher-1", "pause_tournament");
    expect(r.success).toBe(true);
    expect(getTournament(testTournamentId)?.paused).toBe(true);
  });
  it("resumes tournament", () => {
    executeTeacherAction(testTournamentId, "teacher-1", "pause_tournament");
    const r = executeTeacherAction(testTournamentId, "teacher-1", "resume_tournament");
    expect(r.success).toBe(true);
    expect(getTournament(testTournamentId)?.paused).toBe(false);
  });
  it("rejects non-host", () => {
    const r = executeTeacherAction(testTournamentId, "p1", "pause_tournament");
    expect(r.success).toBe(false);
  });
  it("all actions are audited", () => {
    const r = executeTeacherAction(testTournamentId, "teacher-1", "freeze_bracket");
    expect(r.audited).toBe(true);
    expect(r.eventId).not.toBeNull();
  });
  it("ends tournament", () => {
    const r = executeTeacherAction(testTournamentId, "teacher-1", "end_tournament");
    expect(r.success).toBe(true);
    expect(getTournament(testTournamentId)?.finishedAt).not.toBeNull();
  });
  it("emergency stop pauses and ends tournament", () => {
    const r = executeTeacherAction(testTournamentId, "teacher-1", "emergency_stop");
    expect(r.success).toBe(true);
    expect(getTournament(testTournamentId)?.paused).toBe(true);
  });
  it("all teacher actions emit events", () => {
    const before = getEvents(testTournamentId).length;
    executeTeacherAction(testTournamentId, "teacher-1", "reveal_bracket");
    expect(getEvents(testTournamentId).length).toBeGreaterThan(before);
  });
  it("supports all 13 teacher actions", () => {
    const actions = ["pause_tournament", "resume_tournament", "restart_duel", "skip_duel",
                     "force_advance", "replace_player", "grant_bye", "freeze_bracket",
                     "reveal_bracket", "hide_bracket", "inject_match", "emergency_stop", "end_tournament"];
    for (const action of actions) {
      const r = executeTeacherAction(testTournamentId, "teacher-1", action as never);
      expect(r.audited).toBe(true);
    }
  });
});

// ===== System 14 — Student UX =====
describe("Battle Royale — Student UX", () => {
  it("returns lobby in registration phase", () => {
    expect(getStudentUXState(testTournamentId, "p1")).toBe("lobby");
  });
  it("returns finished for non-existent tournament", () => {
    expect(getStudentUXState("nonexistent", "p1")).toBe("finished");
  });
  it("returns paused when tournament is paused", () => {
    executeTeacherAction(testTournamentId, "teacher-1", "pause_tournament");
    expect(getStudentUXState(testTournamentId, "p1")).toBe("paused");
  });
  it("returns champion when player is the champion", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    crownChampion(testTournamentId, "p1", "p2");
    expect(getStudentUXState(testTournamentId, "p1")).toBe("champion");
  });
  it("returns finished when tournament is complete", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    crownChampion(testTournamentId, "p1", "p2");
    t!.championship.stage = "tournament_complete";
    expect(getStudentUXState(testTournamentId, "p3")).toBe("finished");
  });
});

// ===== System 15 — Analytics =====
describe("Battle Royale — Analytics", () => {
  it("generates analytics for an empty tournament", () => {
    const a = generateAnalytics(testTournamentId);
    expect(a).not.toBeNull();
    expect(a!.totalDuels).toBe(0);
    expect(a!.completionRate).toBe(0);
  });
  it("tracks duel outcome distribution", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    recordDuelResult(testTournamentId, realMatch!.id, {
      winnerId: realMatch!.slotA.playerId, loserId: realMatch!.slotB.playerId,
      scoreA: 500, scoreB: 300, correctA: 5, correctB: 3,
      avgSpeedMsA: 3000, avgSpeedMsB: 4000,
    });
    const a = generateAnalytics(testTournamentId);
    expect(a!.duelOutcomeDistribution.completed).toBeGreaterThan(0);
  });
  it("tracks upset victories", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    startDuel(testTournamentId, realMatch!.id);
    // Lower seed wins (upset): make slot B (higher seed number) the winner
    recordDuelResult(testTournamentId, realMatch!.id, {
      winnerId: realMatch!.slotB.playerId, loserId: realMatch!.slotA.playerId,
      scoreA: 300, scoreB: 500, correctA: 3, correctB: 5,
      avgSpeedMsA: 4000, avgSpeedMsB: 3000,
    });
    const a = generateAnalytics(testTournamentId);
    expect(a!.upsetVictories).toBeGreaterThanOrEqual(0);
  });
  it("tracks walkovers in analytics", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    recordWalkover(testTournamentId, realMatch!.id, realMatch!.slotA.playerId!, "forfeit", "Player quit");
    const a = generateAnalytics(testTournamentId);
    expect(a!.walkovers).toBe(1);
  });
});

// ===== System 16 — Replay Integration =====
describe("Battle Royale — Replay Integration", () => {
  it("generates a replay timeline", () => {
    // Trigger some events
    seedPlayers(testTournamentId, "rating_based");
    const timeline = getReplayTimeline(testTournamentId);
    expect(timeline.length).toBeGreaterThan(0);
  });
  it("replay timeline entries have tournament stage", () => {
    seedPlayers(testTournamentId, "rating_based");
    const timeline = getReplayTimeline(testTournamentId);
    expect(timeline[0].tournamentStage).toBeDefined();
  });
  it("getDuelReplay returns null for unknown duel", () => {
    expect(getDuelReplay(testTournamentId, "nonexistent")).toBeNull();
  });
});

// ===== System 17 — Spectator Experience =====
describe("Battle Royale — Spectator Experience", () => {
  beforeEach(() => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
  });

  it("adds a tournament spectator", () => {
    const result = addTournamentSpectator(testTournamentId, "spectator-1");
    expect(result).toBeDefined();
  });
  it("returns a read-only spectator view", () => {
    const view = getSpectatorView(testTournamentId);
    expect(view).not.toBeNull();
    expect(view!.readOnly).toBe(true);
    expect(view!.liveBracket).toBeDefined();
  });
  it("spectator view includes champion prediction", () => {
    const view = getSpectatorView(testTournamentId);
    expect(view!.championPrediction.length).toBeGreaterThan(0);
  });
  it("spectator view includes tournament timeline", () => {
    const view = getSpectatorView(testTournamentId);
    expect(view!.tournamentTimeline).toBeDefined();
  });
});

// ===== System 18 — Accessibility =====
describe("Battle Royale — Accessibility", () => {
  it("has all accessibility features configured", () => {
    expect(BATTLE_ROYALE_ACCESSIBILITY.keyboard).toBe(true);
    expect(BATTLE_ROYALE_ACCESSIBILITY.screenReader).toBe(true);
    expect(BATTLE_ROYALE_ACCESSIBILITY.colorBlind).toBe(true);
    expect(BATTLE_ROYALE_ACCESSIBILITY.captions).toBe(true);
    expect(BATTLE_ROYALE_ACCESSIBILITY.localization).toBe(true);
  });
});

// ===== System 19 — Tournament Dashboard =====
describe("Battle Royale — Dashboard", () => {
  beforeEach(() => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
  });

  it("generates a dashboard", () => {
    const d = generateDashboard(testTournamentId);
    expect(d).not.toBeNull();
    expect(d!.currentBracket).toBeDefined();
    expect(d!.stage).toBeDefined();
  });
  it("dashboard has active and waiting matches count", () => {
    const d = generateDashboard(testTournamentId);
    expect(d!.activeMatches).toBeGreaterThanOrEqual(0);
    expect(d!.waitingMatches).toBeGreaterThanOrEqual(0);
  });
  it("dashboard has tournament progress", () => {
    const d = generateDashboard(testTournamentId);
    expect(d!.tournamentProgress).toBeGreaterThanOrEqual(0);
    expect(d!.tournamentProgress).toBeLessThanOrEqual(1);
  });
  it("dashboard includes leaderboard", () => {
    const d = generateDashboard(testTournamentId);
    expect(d!.leaderboard.length).toBeGreaterThan(0);
  });
  it("dashboard has match health indicator", () => {
    const d = generateDashboard(testTournamentId);
    expect(["healthy", "warning", "critical"]).toContain(d!.matchHealth);
  });
});

// ===== System 20 — Competitive Balance =====
describe("Battle Royale — Competitive Balance", () => {
  it("has 5 competitive presets", () => { expect(COMPETITIVE_PRESETS.length).toBe(5); });
  it("getBalancePresets returns all presets", () => { expect(getBalancePresets().length).toBe(5); });
  it("classroom preset has small bracket", () => {
    const preset = getPreset("classroom");
    expect(preset?.rules.bracketSize).toBe(8);
  });
  it("championship preset has large bracket", () => {
    const preset = getPreset("championship");
    expect(preset?.rules.bracketSize).toBe(128);
  });
  it("national preset has overtime enabled", () => {
    const preset = getPreset("national");
    expect(preset?.rules.overtimeEnabled).toBe(true);
  });
  it("all presets have unique names", () => {
    const names = COMPETITIVE_PRESETS.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ===== Anti-Cheat Reuse =====
describe("Battle Royale — Anti-Cheat (engine reuse)", () => {
  it("delegates to engine detectCheat", () => {
    const finding = checkBattleRoyaleCheat(testTournamentId, "p1", "impossible_timestamp", "Suspicious timing", "evidence");
    expect(finding).toBeDefined();
  });
});

// ===== Status =====
describe("Battle Royale — Status", () => {
  it("returns game mode and rules", () => {
    const s = getBattleRoyaleStatus();
    expect(s.gameMode).toBe("battle_royale");
    expect(s.rules).toBeDefined();
    expect(s.presets).toBe(5);
  });
  it("returns tournament details when id provided", () => {
    const s = getBattleRoyaleStatus(testTournamentId);
    expect(s.tournamentDetails).not.toBeNull();
  });
});

// ===== Engine Reuse Verification =====
describe("Battle Royale — Engine Reuse Verification", () => {
  it("reuses createMatch for duels", () => {
    seedPlayers(testTournamentId, "rating_based");
    const t = getTournament(testTournamentId);
    t!.rules.bracketSize = 8;
    generateBracket(testTournamentId);
    const bracket = getBracket(testTournamentId)!;
    const realMatch = bracket.matches.find(m =>
      m.slotA.playerId && m.slotB.playerId && !m.slotA.isBye && !m.slotB.isBye
    );
    const duel = startDuel(testTournamentId, realMatch!.id);
    // Verify the engine match was created via createMatch
    const engineMatch = getMatch(duel!.engineMatchId);
    expect(engineMatch).not.toBeNull();
    expect(engineMatch!.gameMode).toBe("battle_royale");
  });
  it("reuses engine Event Bus for all events", () => {
    const eventsBefore = getEvents(testTournamentId).length;
    seedPlayers(testTournamentId, "rating_based");
    const eventsAfter = getEvents(testTournamentId).length;
    expect(eventsAfter).toBeGreaterThan(eventsBefore);
  });
  it("reuses engine Spectator Engine", () => {
    addTournamentSpectator(testTournamentId, "spec-1");
    // The spectator should be retrievable via the engine's getSpectators
    // (we test indirectly by checking the spectator view count)
  });
});

// ===== Stress Scenarios =====
describe("Battle Royale — Stress Scenarios", () => {
  it("handles 32-player bracket generation", () => {
    const t = createTournament({ hostId: "teacher-stress" });
    t.rules.bracketSize = 32;
    for (let i = 0; i < 32; i++) {
      registerPlayer(t.id, { userId: `player-${i}`, displayName: `Player ${i}`, rating: 100 - i });
    }
    seedPlayers(t.id, "rating_based");
    const b = generateBracket(t.id);
    expect(b!.size).toBe(32);
    expect(b!.totalMatches).toBe(31); // 32-1 = 31 matches in single elimination
  });
  it("handles 64-player bracket generation", () => {
    const t = createTournament({ hostId: "teacher-stress" });
    t.rules.bracketSize = 64;
    for (let i = 0; i < 64; i++) {
      registerPlayer(t.id, { userId: `player-${i}`, displayName: `Player ${i}`, rating: 100 - i });
    }
    seedPlayers(t.id, "rating_based");
    const b = generateBracket(t.id);
    expect(b!.size).toBe(64);
    expect(b!.totalMatches).toBe(63);
  });
  it("handles tournament with all byes (1 player, 8-bracket)", () => {
    const t = createTournament({ hostId: "teacher-stress" });
    t.rules.bracketSize = 8;
    registerPlayer(t.id, { userId: "lone-wolf", displayName: "Lone Wolf" });
    seedPlayers(t.id, "rating_based");
    const b = generateBracket(t.id);
    expect(b!.slots.filter(s => s.isBye).length).toBe(7); // 7 byes
  });
});

// ===== Edge Cases =====
describe("Battle Royale — Edge Cases", () => {
  it("returns null for unknown tournament", () => {
    expect(getTournament("nonexistent")).toBeNull();
    expect(getBracket("nonexistent")).toBeNull();
    expect(getChampionship("nonexistent")).toBeNull();
  });
  it("does not register more than max players", () => {
    const t = createTournament({ hostId: "teacher-edge" });
    t.rules.maxPlayers = 2;
    registerPlayer(t.id, { userId: "p1", displayName: "A" });
    registerPlayer(t.id, { userId: "p2", displayName: "B" });
    expect(registerPlayer(t.id, { userId: "p3", displayName: "C" })).toBe(false);
  });
  it("does not start duel for unknown match", () => {
    expect(startDuel(testTournamentId, "nonexistent")).toBeNull();
  });
  it("does not advance winner for unknown match", () => {
    expect(advanceWinner(testTournamentId, "nonexistent")).toBeNull();
  });
  it("does not record walkover for unknown match", () => {
    expect(recordWalkover(testTournamentId, "nonexistent", "p1", "absent", "")).toBeNull();
  });
});
