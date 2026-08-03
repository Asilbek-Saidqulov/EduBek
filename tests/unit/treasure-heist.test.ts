/** EduBek — Treasure Heist tests. Phase 6G.3: 14 systems. */
import { describe, it, expect, beforeEach } from "vitest";
import { TREASURE_HEIST_RULES, getRules, validateRules, initEconomy, executeEconomyAction, getGoldBalance, recordTransaction, getTransactionHistory, executeDecision, openDecisionWindow, closeDecisionWindow, getProtection, activateShield, checkShieldExpiry, consumeSteal, teacherProtect, getEventDefinitions, triggerEvent, getActiveEvents, cleanupExpiredEvents } from "@/features/game-modes/treasure-heist/economy-risk-engine";
import { buildTreasureLeaderboard, TREASURE_ACHIEVEMENTS, checkTreasureAchievements, generateTreasureMatchSummary, runQuestionPhase, runAnswerPhase } from "@/features/game-modes/treasure-heist/leaderboards-achievements-flow";
import { executeTreasureTeacherAction, getTreasureStudentUXState, generateTreasureAnalytics, TREASURE_ACCESSIBILITY, getTreasureAccessibility, generateTreasureDashboard, getTreasureHeistStatus } from "@/features/game-modes/treasure-heist/teacher-controls-dashboard";
import { createMatch, emitEvent, getEvents } from "@/features/game-engine";

let testMatchId: string;

beforeEach(() => {
  const m = createMatch({ hostId: "teacher-1", gameMode: "treasure_heist", settings: TREASURE_HEIST_RULES });
  testMatchId = m.id;
  initEconomy(testMatchId, "p1");
  initEconomy(testMatchId, "p2");
});

// ===== System 1 — Rules =====
describe("Treasure Heist — Rules", () => {
  it("has correct game mode", () => { expect(TREASURE_HEIST_RULES.gameMode).toBe("treasure_heist"); });
  it("has starting gold of 100", () => { expect(TREASURE_HEIST_RULES.startingGold).toBe(100); });
  it("has 50% invest probability", () => { expect(TREASURE_HEIST_RULES.investSuccessProbability).toBe(0.5); });
  it("has 50% steal probability", () => { expect(TREASURE_HEIST_RULES.stealSuccessProbability).toBe(0.5); });
  it("validates rules", () => { expect(validateRules({ minPlayers: 1 }).length).toBeGreaterThan(0); expect(validateRules({}).length).toBe(0); });
  it("getRules returns copy", () => { expect(getRules()).not.toBe(TREASURE_HEIST_RULES); });
});

// ===== System 2 — Gold Economy =====
describe("Treasure Heist — Economy", () => {
  it("initializes gold balance", () => { expect(getGoldBalance(testMatchId, "p1")).toBe(100); });
  it("earns gold", () => {
    const tx = executeEconomyAction({ matchId: testMatchId, userId: "p1", action: "earn", amount: 50, reason: "test" });
    recordTransaction(tx);
    expect(getGoldBalance(testMatchId, "p1")).toBe(150);
  });
  it("spends gold", () => {
    const tx = executeEconomyAction({ matchId: testMatchId, userId: "p1", action: "spend", amount: 30, reason: "test" });
    recordTransaction(tx);
    expect(getGoldBalance(testMatchId, "p1")).toBe(70);
  });
  it("transfers gold (steal)", () => {
    const tx = executeEconomyAction({ matchId: testMatchId, userId: "p1", action: "steal", amount: 30, targetUserId: "p2", reason: "steal" });
    recordTransaction(tx);
    // p1 gains 30 (earned via transfer), p2 loses 30 (lost)
    expect(getGoldBalance(testMatchId, "p1")).toBe(130);
    expect(getGoldBalance(testMatchId, "p2")).toBe(70);
  });
  it("tracks transaction history", () => {
    const tx = executeEconomyAction({ matchId: testMatchId, userId: "p1", action: "earn", amount: 10, reason: "test" });
    recordTransaction(tx);
    expect(getTransactionHistory(testMatchId, "p1").length).toBeGreaterThan(0);
  });
  it("never goes below minimum balance", () => {
    executeEconomyAction({ matchId: testMatchId, userId: "p1", action: "spend", amount: 200, reason: "overspend" });
    expect(getGoldBalance(testMatchId, "p1")).toBeGreaterThanOrEqual(0);
  });
});

// ===== System 3 — Risk Decisions =====
describe("Treasure Heist — Risk Decisions", () => {
  it("SAVE always succeeds and keeps reward", () => {
    const r = executeDecision({ matchId: testMatchId, userId: "p1", decision: "save", reward: 50, questionIndex: 0 });
    expect(r.success).toBe(true); expect(r.amount).toBe(50); expect(r.newBalance).toBe(150);
  });
  it("INVEST either doubles or loses", () => {
    const r = executeDecision({ matchId: testMatchId, userId: "p1", decision: "invest", reward: 50, questionIndex: 0 });
    if (r.success) { expect(r.amount).toBe(100); } else { expect(r.amount).toBe(-50); }
  });
  it("STEAL checks protection", () => {
    activateShield(testMatchId, "p2");
    const r = executeDecision({ matchId: testMatchId, userId: "p1", decision: "steal", reward: 50, targetUserId: "p2", questionIndex: 0, protection: getProtection(testMatchId, "p2") });
    expect(r.success).toBe(false); expect(r.message).toContain("shield");
  });
  it("STEAL has limited uses", () => {
    const p = getProtection(testMatchId, "p1");
    p.stealsRemaining = 0;
    const r = executeDecision({ matchId: testMatchId, userId: "p1", decision: "steal", reward: 50, targetUserId: "p2", questionIndex: 0, protection: p });
    expect(r.success).toBe(false); expect(r.message).toContain("remaining");
  });
  it("opens and closes decision window", () => {
    const w = openDecisionWindow({ matchId: testMatchId, userId: "p1", questionIndex: 0, reward: 50 });
    expect(w.decided).toBe(false);
    const closed = closeDecisionWindow(w, "save");
    expect(closed.decided).toBe(true); expect(closed.decision).toBe("save");
  });
  it("decision is deterministic for same seed", () => {
    const r1 = executeDecision({ matchId: testMatchId, userId: "p1", decision: "invest", reward: 50, questionIndex: 0 });
    const r2 = executeDecision({ matchId: testMatchId, userId: "p1", decision: "invest", reward: 50, questionIndex: 0 });
    expect(r1.success).toBe(r2.success);
  });
});

// ===== System 4 — Protection =====
describe("Treasure Heist — Protection", () => {
  it("activates shield", () => {
    const p = activateShield(testMatchId, "p1");
    expect(p.shieldActive).toBe(true); expect(p.shieldExpiresAt).toBeTruthy();
  });
  it("expires shield", () => {
    activateShield(testMatchId, "p1");
    // Manually expire
    const key = `${testMatchId}:p1`;
    const p = getProtection(testMatchId, "p1");
    p.shieldExpiresAt = new Date(Date.now() - 1000).toISOString();
    const expired = checkShieldExpiry(testMatchId, "p1");
    expect(expired.shieldActive).toBe(false);
  });
  it("consumes steal use", () => {
    const before = getProtection(testMatchId, "p1").stealsRemaining;
    consumeSteal(testMatchId, "p1");
    const after = getProtection(testMatchId, "p1").stealsRemaining;
    expect(after).toBe(before - 1);
  });
  it("teacher protects player", () => {
    const p = teacherProtect(testMatchId, "p1");
    expect(p.protectedByTeacher).toBe(true); expect(p.shieldActive).toBe(true);
  });
});

// ===== System 5 — Random Events =====
describe("Treasure Heist — Events", () => {
  it("has 10 event definitions", () => { expect(getEventDefinitions().length).toBe(10); });
  it("triggers golden chest", () => {
    const inst = triggerEvent(testMatchId, "golden_chest", "p1");
    expect(inst.event.kind).toBe("golden_chest"); expect(inst.event.active).toBe(true);
  });
  it("applies gold bonus from event", () => {
    const before = getGoldBalance(testMatchId, "p1");
    triggerEvent(testMatchId, "golden_chest", "p1");
    expect(getGoldBalance(testMatchId, "p1")).toBe(before + 50);
  });
  it("applies gold loss from bandits", () => {
    const before = getGoldBalance(testMatchId, "p1");
    triggerEvent(testMatchId, "bandits", "p1");
    expect(getGoldBalance(testMatchId, "p1")).toBe(before - 30);
  });
  it("activates shield from merchant", () => {
    triggerEvent(testMatchId, "merchant", "p1");
    expect(getProtection(testMatchId, "p1").shieldActive).toBe(true);
  });
  it("lists active events", () => {
    triggerEvent(testMatchId, "storm", null);
    expect(getActiveEvents(testMatchId).length).toBeGreaterThan(0);
  });
  it("cleans up expired events", () => {
    triggerEvent(testMatchId, "lucky_coin", "p1");
    cleanupExpiredEvents(testMatchId);
    // lucky_coin has 30s duration — should still be active
    expect(getActiveEvents(testMatchId).length).toBeGreaterThan(0);
  });
});

// ===== System 6 — Gameplay Flow =====
describe("Treasure Heist — Gameplay", () => {
  it("runs question phase", () => { expect(runQuestionPhase(testMatchId, 0)).toBe("question"); });
  it("runs answer phase (correct)", () => { expect(runAnswerPhase(testMatchId, "p1", "A", true)).toBe("reward"); });
  it("runs answer phase (wrong)", () => { expect(runAnswerPhase(testMatchId, "p1", "A", false)).toBe("next_question"); });
});

// ===== System 7 — Leaderboards =====
describe("Treasure Heist — Leaderboards", () => {
  const players = [
    { userId: "p1", displayName: "Alice", matchId: "", correctAnswers: 5, totalAnswered: 6, avgSpeedMs: 3000, stealsAttempted: 2, stealsSuccessful: 1, investmentsAttempted: 3, investmentsSuccessful: 2 },
    { userId: "p2", displayName: "Bob", matchId: "", correctAnswers: 4, totalAnswered: 6, avgSpeedMs: 5000, stealsAttempted: 3, stealsSuccessful: 2, investmentsAttempted: 1, investmentsSuccessful: 0 },
  ];
  it("sorts by gold", () => {
    const lb = buildTreasureLeaderboard(players.map(p => ({ ...p, matchId: testMatchId })), "gold");
    expect(lb[0].rank).toBe(1); expect(lb[1].rank).toBe(2);
  });
  it("sorts by steals", () => {
    const lb = buildTreasureLeaderboard(players.map(p => ({ ...p, matchId: testMatchId })), "steals");
    expect(lb[0].userId).toBe("p2"); // 2 steals vs 1
  });
  it("sorts by accuracy", () => {
    const lb = buildTreasureLeaderboard(players.map(p => ({ ...p, matchId: testMatchId })), "accuracy");
    expect(lb[0].userId).toBe("p1"); // 5/6 > 4/6
  });
});

// ===== System 8 — Achievements =====
describe("Treasure Heist — Achievements", () => {
  it("has 10 achievements", () => { expect(TREASURE_ACHIEVEMENTS.length).toBe(10); });
  it("awards Treasure King for 500+ gold", () => {
    const achs = checkTreasureAchievements({ correctCount: 5, totalAnswered: 5, goldEarned: 500, goldLost: 0, currentGold: 500, stealsAttempted: 0, stealsSuccessful: 0, investmentsAttempted: 0, investmentsSuccessful: 0, rank: 1, perfectRound: true, maxGold: 500 });
    expect(achs.some(a => a.id === "treasure_king")).toBe(true);
  });
  it("awards Master Thief for 5+ steals", () => {
    const achs = checkTreasureAchievements({ correctCount: 5, totalAnswered: 5, goldEarned: 100, goldLost: 0, currentGold: 100, stealsAttempted: 5, stealsSuccessful: 5, investmentsAttempted: 0, investmentsSuccessful: 0, rank: 1, perfectRound: false, maxGold: 100 });
    expect(achs.some(a => a.id === "master_thief")).toBe(true);
  });
  it("awards Perfect Investor", () => {
    const achs = checkTreasureAchievements({ correctCount: 5, totalAnswered: 5, goldEarned: 300, goldLost: 0, currentGold: 300, stealsAttempted: 0, stealsSuccessful: 0, investmentsAttempted: 3, investmentsSuccessful: 3, rank: 1, perfectRound: true, maxGold: 300 });
    expect(achs.some(a => a.id === "perfect_investor")).toBe(true);
  });
});

// ===== System 9 — Match Summary =====
describe("Treasure Heist — Summary", () => {
  it("generates match summary", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    const s = generateTreasureMatchSummary(testMatchId);
    expect(s).not.toBeNull(); expect(s!.topPlayers.length).toBeGreaterThan(0);
  });
  it("summary has investment stats", () => {
    const s = generateTreasureMatchSummary(testMatchId);
    expect(s!.investmentStats).toBeDefined(); expect(s!.investmentStats).toHaveProperty("attempted");
  });
  it("summary has steal stats", () => {
    const s = generateTreasureMatchSummary(testMatchId);
    expect(s!.stealStats).toBeDefined();
  });
  it("summary has decision distribution", () => {
    const s = generateTreasureMatchSummary(testMatchId);
    expect(s!.decisionDistribution).toHaveProperty("save"); expect(s!.decisionDistribution).toHaveProperty("invest"); expect(s!.decisionDistribution).toHaveProperty("steal");
  });
});

// ===== System 10 — Teacher Controls =====
describe("Treasure Heist — Teacher", () => {
  it("gives bonus gold", () => {
    const r = executeTreasureTeacherAction(testMatchId, "teacher-1", "give_bonus", { userId: "p1", amount: 50 });
    expect(r.success).toBe(true); expect(getGoldBalance(testMatchId, "p1")).toBe(150);
  });
  it("deducts gold", () => {
    const r = executeTreasureTeacherAction(testMatchId, "teacher-1", "deduct_gold", { userId: "p1", amount: 30 });
    expect(r.success).toBe(true); expect(getGoldBalance(testMatchId, "p1")).toBe(70);
  });
  it("protects player", () => {
    const r = executeTreasureTeacherAction(testMatchId, "teacher-1", "protect_player", { userId: "p1" });
    expect(r.success).toBe(true); expect(getProtection(testMatchId, "p1").protectedByTeacher).toBe(true);
  });
  it("injects event", () => {
    const r = executeTreasureTeacherAction(testMatchId, "teacher-1", "inject_event", { eventKind: "golden_chest", userId: "p1" });
    expect(r.success).toBe(true);
  });
  it("rejects non-host", () => {
    const r = executeTreasureTeacherAction(testMatchId, "p1", "pause");
    expect(r.success).toBe(false);
  });
  it("emergency stop cancels", () => {
    const r = executeTreasureTeacherAction(testMatchId, "teacher-1", "emergency_stop");
    expect(r.success).toBe(true);
  });
});

// ===== System 11 — Student UX =====
describe("Treasure Heist — Student UX", () => {
  it("returns waiting for unknown match", () => {
    expect(getTreasureStudentUXState("nonexistent", "p1")).toBe("waiting");
  });
  it("returns waiting in lobby", () => {
    expect(getTreasureStudentUXState(testMatchId, "teacher-1")).toBe("waiting");
  });
});

// ===== System 12 — Analytics =====
describe("Treasure Heist — Analytics", () => {
  it("generates analytics", () => {
    const a = generateTreasureAnalytics(testMatchId);
    expect(a).not.toBeNull(); expect(a!.economy).toHaveProperty("avgGold");
  });
  it("tracks decision distribution", () => {
    const a = generateTreasureAnalytics(testMatchId);
    expect(a!.decisions).toHaveProperty("saveCount"); expect(a!.decisions).toHaveProperty("investCount"); expect(a!.decisions).toHaveProperty("stealCount");
  });
});

// ===== System 13 — Accessibility =====
describe("Treasure Heist — Accessibility", () => {
  it("has all features", () => {
    expect(TREASURE_ACCESSIBILITY.keyboardNavigation).toBe(true);
    expect(TREASURE_ACCESSIBILITY.audioCues).toBe(true);
  });
  it("returns copy", () => { expect(getTreasureAccessibility()).not.toBe(TREASURE_ACCESSIBILITY); });
});

// ===== System 14 — Dashboard =====
describe("Treasure Heist — Dashboard", () => {
  it("generates dashboard", () => {
    const d = generateTreasureDashboard(testMatchId);
    expect(d).not.toBeNull(); expect(d!.currentLeaders.length).toBeGreaterThan(0);
  });
  it("dashboard has economy graph", () => {
    const d = generateTreasureDashboard(testMatchId);
    expect(d!.economyGraph).toBeDefined();
  });
});

// ===== Extended checks =====
describe("Treasure Heist — Extended", () => {
  it("status works", () => {
    const s = getTreasureHeistStatus();
    expect(s.gameMode).toBe("treasure_heist");
  });
  it("economy transactions use engine resource pipeline", () => {
    const before = getGoldBalance(testMatchId, "p1");
    executeEconomyAction({ matchId: testMatchId, userId: "p1", action: "bonus", amount: 25, reason: "test" });
    expect(getGoldBalance(testMatchId, "p1")).toBe(before + 25);
  });
  it("all achievements have XP", () => {
    for (const a of TREASURE_ACHIEVEMENTS) expect(a.xpReward).toBeGreaterThan(0);
  });
  it("all events have priority", () => {
    for (const e of getEventDefinitions()) expect(e.priority).toBeGreaterThan(0);
  });
  it("teacher actions emit events", () => {
    const before = getEvents(testMatchId).length;
    executeTreasureTeacherAction(testMatchId, "teacher-1", "pause");
    const after = getEvents(testMatchId).length;
    expect(after).toBeGreaterThan(before);
  });
  it("rules support 500 players", () => { expect(TREASURE_HEIST_RULES.maxPlayers).toBeGreaterThanOrEqual(500); });
  it("decision timeout is configurable", () => { expect(TREASURE_HEIST_RULES.decisionTimeoutMs).toBeGreaterThan(0); });
  it("invest multiplier is 2x by default", () => { expect(TREASURE_HEIST_RULES.investMultiplier).toBe(2); });
  it("steal penalty exists", () => { expect(TREASURE_HEIST_RULES.stealPenalty).toBeGreaterThan(0); });
  it("new player protection exists", () => { expect(TREASURE_HEIST_RULES.newPlayerProtectionRounds).toBeGreaterThan(0); });
});
