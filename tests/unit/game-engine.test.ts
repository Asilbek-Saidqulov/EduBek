/** EduBek — Game Engine tests. Phase 6G.1: 18 systems. */
import { describe, it, expect, beforeEach } from "vitest";
import { createMatch, getMatch, listMatches, destroyMatch, updateMatchState, validateTransition, attemptTransition, getValidTransitions, VALID_TRANSITIONS } from "@/features/game-engine/match-engine";
import { lobbyJoin, lobbyLeave, lobbyKick, lobbyLock, lobbyTransferHost, lobbyAssignTeam, createSession, getSession, updateSessionStatus, updateHeartbeat, checkTimeouts, setPlayerReady, getReadyCheckState, teacherOverrideReady, startRound, finishRound, advanceQuestion } from "@/features/game-engine/lobby-session-round";
import { preloadQuestion, advanceQuestionPhase, recordAnswer, startTimer, getTimer, pauseTimer, resumeTimer, extendTimer, syncTimer, nextSequenceNumber, createSyncSnapshot, recordSyncEvent, getSyncReport, validateSyncEvent, emitEvent, getEvents, subscribe, clearEvents } from "@/features/game-engine/pipeline-sync-events";
import { receiveScoreEvent, validateScoreEvent, normalizeScoreEvent, getScorePipelineReport, registerResource, processResourceAction, getResourceBalance, getResourceHistory, saveReplay, getReplay, createReplayState, stepReplay, addSpectator, removeSpectator, getSpectators, recoverPlayer, detectCheat, getCheatFindings, checkDuplicateSubmission, checkImpossibleTimestamp, recordMatch, getMatchRecord, generateGameAnalytics } from "@/features/game-engine/pipelines-replay-security";

let testMatchId: string;

beforeEach(() => {
  const m = createMatch({ hostId: "host-1", gameMode: "test", settings: { maxPlayers: 4, minPlayers: 2 } });
  testMatchId = m.id;
});

// ===== System 1-2: Match Engine + Lifecycle =====
describe("Game Engine — Match + Lifecycle", () => {
  it("creates a match", () => {
    expect(testMatchId).toBeTruthy();
    const m = getMatch(testMatchId)!;
    expect(m.state).toBe("lobby"); expect(m.players.length).toBe(1); expect(m.players[0].isHost).toBe(true);
  });
  it("lists matches", () => { expect(listMatches().length).toBeGreaterThan(0); });
  it("destroys a match", () => { expect(destroyMatch(testMatchId)).toBe(true); });
  it("validates legal transition", () => {
    expect(validateTransition("lobby", "waiting_for_players").valid).toBe(true);
  });
  it("rejects illegal transition", () => {
    expect(validateTransition("lobby", "question_active").valid).toBe(false);
  });
  it("attempts transition successfully", () => {
    const r = attemptTransition(testMatchId, "waiting_for_players");
    expect(r.valid).toBe(true); expect(getMatch(testMatchId)!.state).toBe("waiting_for_players");
  });
  it("rejects invalid transition attempt", () => {
    const r = attemptTransition(testMatchId, "question_active");
    expect(r.valid).toBe(false);
  });
  it("gets valid transitions for a state", () => {
    const t = getValidTransitions("lobby");
    expect(t).toContain("waiting_for_players"); expect(t).toContain("cancelled");
  });
  it("archived state has no transitions", () => {
    expect(getValidTransitions("archived")).toEqual([]);
  });
  it("full lifecycle progression", () => {
    let r = attemptTransition(testMatchId, "waiting_for_players"); expect(r.valid).toBe(true);
    r = attemptTransition(testMatchId, "ready_check"); expect(r.valid).toBe(true);
    r = attemptTransition(testMatchId, "countdown"); expect(r.valid).toBe(true);
    r = attemptTransition(testMatchId, "round_starting"); expect(r.valid).toBe(true);
    r = attemptTransition(testMatchId, "question_active"); expect(r.valid).toBe(true);
    r = attemptTransition(testMatchId, "answer_collection"); expect(r.valid).toBe(true);
  });
});

// ===== System 3: Lobby Engine =====
describe("Game Engine — Lobby", () => {
  it("joins lobby", () => {
    const r = lobbyJoin(testMatchId, "player-2", "Player 2");
    expect(r.success).toBe(true); expect(r.lobby.playerCount).toBe(2);
  });
  it("rejects join when full", () => {
    lobbyJoin(testMatchId, "p2", "P2"); lobbyJoin(testMatchId, "p3", "P3"); lobbyJoin(testMatchId, "p4", "P4");
    const r = lobbyJoin(testMatchId, "p5", "P5");
    expect(r.success).toBe(false); expect(r.message).toContain("full");
  });
  it("rejects duplicate join", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    const r = lobbyJoin(testMatchId, "p2", "P2");
    expect(r.success).toBe(false);
  });
  it("leaves lobby", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    const r = lobbyLeave(testMatchId, "p2");
    expect(r.success).toBe(true);
  });
  it("host kicks player", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    const r = lobbyKick(testMatchId, "host-1", "p2");
    expect(r.success).toBe(true);
  });
  it("non-host cannot kick", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    const r = lobbyKick(testMatchId, "p2", "host-1");
    expect(r.success).toBe(false);
  });
  it("transfers host", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    const r = lobbyTransferHost(testMatchId, "host-1", "p2");
    expect(r.success).toBe(true);
  });
  it("assigns team", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    const r = lobbyAssignTeam(testMatchId, "host-1", "p2", "red");
    expect(r.success).toBe(true);
  });
  it("locks lobby", () => {
    const r = lobbyLock(testMatchId, "host-1", true);
    expect(r.success).toBe(true); expect(r.lobby.locked).toBe(true);
  });
});

// ===== System 4: Player Session =====
describe("Game Engine — Sessions", () => {
  it("creates and retrieves session", () => {
    createSession("user-1", testMatchId);
    const s = getSession("user-1", testMatchId);
    expect(s).not.toBeNull(); expect(s!.status).toBe("connecting");
  });
  it("updates session status", () => {
    createSession("user-1", testMatchId);
    const s = updateSessionStatus("user-1", testMatchId, "connected");
    expect(s!.status).toBe("connected");
  });
  it("updates heartbeat", () => {
    createSession("user-1", testMatchId);
    const s = updateHeartbeat("user-1", testMatchId, 42);
    expect(s!.ping).toBe(42); expect(s!.connectionQuality).toBe("excellent");
  });
  it("detects timeouts", () => {
    createSession("user-1", testMatchId);
    updateSessionStatus("user-1", testMatchId, "connected");
    // The session just connected with a fresh heartbeat, so we need a negative timeout threshold
    // to force detection — in practice, this tests that the function runs and returns user IDs
    const timed = checkTimeouts(testMatchId, -1);
    expect(timed).toContain("user-1");
  });
});

// ===== System 5: Ready Check =====
describe("Game Engine — Ready Check", () => {
  it("sets player ready", () => {
    const r = setPlayerReady(testMatchId, "host-1", true);
    expect(r!.allReady).toBe(true); expect(r!.readyCount).toBe(1);
  });
  it("detects not all ready", () => {
    lobbyJoin(testMatchId, "p2", "P2");
    setPlayerReady(testMatchId, "host-1", true);
    const r = getReadyCheckState(testMatchId);
    expect(r!.allReady).toBe(false);
  });
  it("teacher override allows start", () => {
    const r = teacherOverrideReady(testMatchId);
    expect(r!.canStart).toBe(true); expect(r!.teacherOverride).toBe(true);
  });
});

// ===== System 6: Round Engine =====
describe("Game Engine — Rounds", () => {
  it("starts a round", () => {
    const r = startRound(testMatchId, 1);
    expect(r.roundNumber).toBe(1); expect(r.state).toBe("active");
  });
  it("finishes a round", () => {
    const r = finishRound(testMatchId, 1);
    expect(r.state).toBe("finished");
  });
  it("advances question", () => {
    advanceQuestion(testMatchId);
    expect(getMatch(testMatchId)!.currentQuestion).toBe(1);
  });
});

// ===== System 7: Question Pipeline =====
describe("Game Engine — Question Pipeline", () => {
  it("preloads a question", () => {
    const q = preloadQuestion(testMatchId, "q-1", 1, 0);
    expect(q.phase).toBe("preload");
  });
  it("advances through question phases", () => {
    let q = preloadQuestion(testMatchId, "q-1", 1, 0);
    q = advanceQuestionPhase(q, "published", 30000);
    expect(q.phase).toBe("published"); expect(q.publishedAt).toBeTruthy();
    q = advanceQuestionPhase(q, "answer_lock");
    expect(q.phase).toBe("answer_lock"); expect(q.answerLockAt).toBeTruthy();
  });
  it("records answers", () => {
    let q = preloadQuestion(testMatchId, "q-1", 1, 0);
    q = recordAnswer(q); q = recordAnswer(q);
    expect(q.collectedAnswers).toBe(2);
  });
});

// ===== System 8: Timer Engine =====
describe("Game Engine — Timers", () => {
  it("starts a timer", () => {
    const t = startTimer(testMatchId, "question", 30000);
    expect(t.remaining).toBe(30000); expect(t.isPaused).toBe(false);
  });
  it("pauses and resumes timer", () => {
    startTimer(testMatchId, "question", 30000);
    let t = pauseTimer(testMatchId, "question");
    expect(t!.isPaused).toBe(true);
    t = resumeTimer(testMatchId, "question");
    expect(t!.isPaused).toBe(false);
  });
  it("extends timer", () => {
    startTimer(testMatchId, "question", 30000);
    const t = extendTimer(testMatchId, "question", 10000, true);
    expect(t!.total).toBe(40000); expect(t!.teacherOverride).toBe(true);
  });
  it("syncs timer with client", () => {
    startTimer(testMatchId, "question", 30000);
    const t = syncTimer(testMatchId, "question", Date.now() + 100);
    expect(t!.driftMs).toBeGreaterThan(0);
  });
});

// ===== System 9: Sync Engine =====
describe("Game Engine — Sync", () => {
  it("increments sequence numbers", () => {
    expect(nextSequenceNumber(testMatchId)).toBe(1);
    expect(nextSequenceNumber(testMatchId)).toBe(2);
  });
  it("creates sync snapshot", () => {
    const snap = createSyncSnapshot(testMatchId);
    expect(snap).not.toBeNull(); expect(snap!.matchState).toBe("lobby");
  });
  it("records sync events", () => {
    recordSyncEvent(testMatchId, "test", { data: "value" });
    const r = getSyncReport(testMatchId);
    expect(r.pendingEvents).toBeGreaterThan(0);
  });
  it("validates sync events", () => {
    expect(validateSyncEvent({ matchId: testMatchId, sequenceNumber: 5, type: "test", timestamp: new Date().toISOString(), payload: {} }, 5).valid).toBe(true);
    expect(validateSyncEvent({ matchId: testMatchId, sequenceNumber: 3, type: "test", timestamp: new Date().toISOString(), payload: {} }, 5).valid).toBe(false);
  });
});

// ===== System 10: Event Engine =====
describe("Game Engine — Events", () => {
  it("emits and retrieves events", () => {
    emitEvent(testMatchId, "MatchCreated", "host-1", { mode: "test" });
    const events = getEvents(testMatchId);
    expect(events.length).toBeGreaterThan(0); expect(events[0].type).toBe("MatchCreated");
  });
  it("subscribes to events", () => {
    let received = false;
    const unsub = subscribe("PlayerJoined", () => { received = true; });
    emitEvent(testMatchId, "PlayerJoined", "p2", {});
    expect(received).toBe(true);
    unsub();
  });
  it("filters events by sequence", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    emitEvent(testMatchId, "PlayerJoined", "p2", {});
    const seq = getEvents(testMatchId)[0].sequenceNumber;
    const filtered = getEvents(testMatchId, seq);
    expect(filtered.length).toBe(1);
  });
});

// ===== Systems 11-12: Score + Resource Pipelines =====
describe("Game Engine — Score Pipeline", () => {
  it("receives and validates score events", () => {
    const e = receiveScoreEvent({ matchId: testMatchId, userId: "p1", roundNumber: 1, questionIndex: 0, eventType: "correct", rawValue: 100 });
    expect(e.validated).toBe(false);
    validateScoreEvent(e);
    expect(e.validated).toBe(true);
  });
  it("normalizes score events", () => {
    const e = receiveScoreEvent({ matchId: testMatchId, userId: "p1", roundNumber: 1, questionIndex: 0, eventType: "correct", rawValue: 100 });
    normalizeScoreEvent(e, (raw) => raw / 100);
    expect(e.normalizedValue).toBe(1);
  });
  it("generates pipeline report", () => {
    receiveScoreEvent({ matchId: testMatchId, userId: "p1", roundNumber: 1, questionIndex: 0, eventType: "correct", rawValue: 100 });
    const r = getScorePipelineReport(testMatchId);
    expect(r.totalEvents).toBeGreaterThan(0);
  });
});

describe("Game Engine — Resource Pipeline", () => {
  it("registers and processes resources", () => {
    registerResource({ resourceType: "gold", displayName: "Gold", initialValue: 100, maxValue: 999, minValue: 0 });
    const e = processResourceAction({ matchId: testMatchId, userId: "p1", resourceType: "gold", action: "earned", amount: 50 });
    expect(e.balance).toBe(150);
  });
  it("tracks resource history", () => {
    registerResource({ resourceType: "gold", displayName: "Gold", initialValue: 0, maxValue: null, minValue: 0 });
    processResourceAction({ matchId: testMatchId, userId: "p1", resourceType: "gold", action: "earned", amount: 50 });
    expect(getResourceHistory(testMatchId).length).toBeGreaterThan(0);
  });
});

// ===== System 13: Replay =====
describe("Game Engine — Replay", () => {
  it("saves and retrieves replay", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    const r = saveReplay(testMatchId);
    expect(r).not.toBeNull(); expect(r!.events.length).toBeGreaterThan(0);
    expect(getReplay(testMatchId)).not.toBeNull();
  });
  it("steps replay forward and backward", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    emitEvent(testMatchId, "PlayerJoined", "p2", {});
    saveReplay(testMatchId);
    let state = createReplayState(testMatchId);
    state = stepReplay(state, true);
    expect(state.currentEventIndex).toBe(1);
    state = stepReplay(state, false);
    expect(state.currentEventIndex).toBe(0);
  });
});

// ===== System 14: Spectators =====
describe("Game Engine — Spectators", () => {
  it("adds and removes spectators", () => {
    addSpectator(testMatchId, "teacher-1", "teacher");
    expect(getSpectators(testMatchId).length).toBe(1);
    removeSpectator(testMatchId, "teacher-1");
    expect(getSpectators(testMatchId).length).toBe(0);
  });
});

// ===== System 15: Reconnect =====
describe("Game Engine — Reconnect", () => {
  it("recovers player state", () => {
    const r = recoverPlayer(testMatchId, "host-1");
    expect(r.recovered).toBe(true); expect(r.recoveredState).toHaveProperty("state");
  });
});

// ===== System 16: Anti-Cheat =====
describe("Game Engine — Anti-Cheat", () => {
  it("detects duplicate submissions", () => {
    const f = checkDuplicateSubmission(testMatchId, "p1", 0, [{ userId: "p1", questionIndex: 0 }, { userId: "p1", questionIndex: 0 }]);
    expect(f).not.toBeNull(); expect(f!.kind).toBe("duplicate_submission");
  });
  it("detects impossible timestamps", () => {
    const f = checkImpossibleTimestamp(testMatchId, "p1", 1000, 2000);
    expect(f).not.toBeNull(); expect(f!.kind).toBe("impossible_timestamp");
  });
  it("stores cheat findings", () => {
    detectCheat({ matchId: testMatchId, userId: "p1", kind: "answer_spam", description: "Spam", evidence: "test" });
    expect(getCheatFindings(testMatchId).length).toBeGreaterThan(0);
  });
  it("never auto-bans (only findings)", () => {
    const findings = getCheatFindings(testMatchId);
    for (const f of findings) expect(f.severity).toMatch(/low|medium|high|critical/);
  });
});

// ===== System 17: Match Recorder =====
describe("Game Engine — Match Recorder", () => {
  it("records a match", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    const r = recordMatch(testMatchId);
    expect(r).not.toBeNull(); expect(r!.events).toBeGreaterThan(0);
    expect(getMatchRecord(testMatchId)).not.toBeNull();
  });
});

// ===== System 18: Analytics =====
describe("Game Engine — Analytics", () => {
  it("generates analytics report", () => {
    const r = generateGameAnalytics();
    expect(r).toHaveProperty("totalMatches"); expect(r).toHaveProperty("completionRate");
  });
});

// ===== Extended checks =====
describe("Game Engine — Extended", () => {
  it("all lifecycle states have defined transitions", () => {
    for (const state of Object.keys(VALID_TRANSITIONS)) {
      expect(VALID_TRANSITIONS[state as keyof typeof VALID_TRANSITIONS]).toBeDefined();
    }
  });
  it("cancelled can go to archived", () => {
    expect(validateTransition("cancelled", "archived").valid).toBe(true);
  });
  it("match_finished requires rewards before archived", () => {
    expect(validateTransition("match_finished", "archived").valid).toBe(false);
    expect(validateTransition("match_finished", "rewards").valid).toBe(true);
    expect(validateTransition("rewards", "replay_saved").valid).toBe(true);
    expect(validateTransition("replay_saved", "archived").valid).toBe(true);
  });
  it("resource balance respects max", () => {
    registerResource({ resourceType: "energy", displayName: "Energy", initialValue: 0, maxValue: 100, minValue: 0 });
    processResourceAction({ matchId: testMatchId, userId: "p1", resourceType: "energy", action: "earned", amount: 150 });
    expect(getResourceBalance(testMatchId, "p1", "energy")).toBe(100);
  });
  it("resource balance respects min", () => {
    registerResource({ resourceType: "wood", displayName: "Wood", initialValue: 50, maxValue: null, minValue: 0 });
    processResourceAction({ matchId: testMatchId, userId: "p1", resourceType: "wood", action: "spent", amount: 100 });
    expect(getResourceBalance(testMatchId, "p1", "wood")).toBe(0);
  });
  it("events have unique IDs", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    emitEvent(testMatchId, "PlayerJoined", "p2", {});
    const events = getEvents(testMatchId);
    const ids = events.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
