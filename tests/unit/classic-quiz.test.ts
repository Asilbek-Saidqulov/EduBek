/** EduBek — Classic Quiz tests. Phase 6G.2: 14 systems. */
import { describe, it, expect, beforeEach } from "vitest";
import { CLASSIC_QUIZ_RULES, getRules, validateRules, calculateScore, calculateScoreWithPlugin, SCORING_CONFIG, createStreakState, updateStreak, checkStreakMilestones, STREAK_MILESTONES, buildLeaderboard, ACHIEVEMENTS, checkAchievements, calculateXP } from "@/features/game-modes/classic-quiz/rules-scoring-leaderboard";
import { startClassicQuizMatch, runQuestionFlow, submitAnswer, lockAnswers, advanceToNextQuestion, executeTeacherAction, getStudentUXState, generateMatchSummary, generateMatchAnalytics, generateReplayTimeline, checkClassicQuizCheats, ACCESSIBILITY_CONFIG, getAccessibilityConfig, generateTeacherDashboard, getClassicQuizStatus } from "@/features/game-modes/classic-quiz/gameplay-controls-analytics";
import { createMatch, getMatch, attemptTransition, emitEvent, startTimer, saveReplay, getEvents } from "@/features/game-engine";

let testMatchId: string;

beforeEach(() => {
  testMatchId = startClassicQuizMatch({ hostId: "teacher-1" });
});

// ===== System 1 — Rules =====
describe("Classic Quiz — Rules", () => {
  it("has correct game mode", () => { expect(CLASSIC_QUIZ_RULES.gameMode).toBe("classic_quiz"); });
  it("supports 2-10000 players", () => { expect(CLASSIC_QUIZ_RULES.minPlayers).toBe(2); expect(CLASSIC_QUIZ_RULES.maxPlayers).toBe(10000); });
  it("has 3 rounds with 5 questions each", () => { expect(CLASSIC_QUIZ_RULES.roundCount).toBe(3); expect(CLASSIC_QUIZ_RULES.questionsPerRound).toBe(5); });
  it("overtime is disabled", () => { expect(CLASSIC_QUIZ_RULES.overtimeDisabled).toBe(true); });
  it("validates rules correctly", () => {
    expect(validateRules({ minPlayers: 1 }).length).toBeGreaterThan(0);
    expect(validateRules({ minPlayers: 2 }).length).toBe(0);
  });
  it("getRules returns a copy", () => { expect(getRules()).not.toBe(CLASSIC_QUIZ_RULES); });
  it("has 13 teacher controls", () => { expect(CLASSIC_QUIZ_RULES.hostControls.length).toBe(13); });
});

// ===== System 3 — Scoring =====
describe("Classic Quiz — Scoring", () => {
  it("correct answer with 0-3s gets max score", () => {
    const r = calculateScore({ isCorrect: true, responseTimeMs: 2000, thresholdMs: 30000 });
    expect(r.totalScore).toBe(1000); expect(r.tier).toBe("perfect");
  });
  it("correct answer with 3-6s gets 800", () => {
    const r = calculateScore({ isCorrect: true, responseTimeMs: 5000, thresholdMs: 30000 });
    expect(r.totalScore).toBe(800); expect(r.tier).toBe("great");
  });
  it("correct answer with 6-10s gets 600", () => {
    const r = calculateScore({ isCorrect: true, responseTimeMs: 8000, thresholdMs: 30000 });
    expect(r.totalScore).toBe(600); expect(r.tier).toBe("good");
  });
  it("correct answer after 10s gets 500", () => {
    const r = calculateScore({ isCorrect: true, responseTimeMs: 15000, thresholdMs: 30000 });
    expect(r.totalScore).toBe(500); expect(r.tier).toBe("ok");
  });
  it("wrong answer gets 0", () => {
    const r = calculateScore({ isCorrect: false, responseTimeMs: 1000, thresholdMs: 30000 });
    expect(r.totalScore).toBe(0); expect(r.tier).toBe("wrong");
  });
  it("no negative score", () => {
    const r = calculateScore({ isCorrect: false, responseTimeMs: 30000, thresholdMs: 30000 });
    expect(r.totalScore).toBeGreaterThanOrEqual(0);
  });
  it("max score is 1000", () => {
    const r = calculateScore({ isCorrect: true, responseTimeMs: 0, thresholdMs: 30000 });
    expect(r.totalScore).toBeLessThanOrEqual(1000);
  });
  it("supports plugin scoring", () => {
    const r = calculateScoreWithPlugin({ isCorrect: true, responseTimeMs: 2000, thresholdMs: 30000 }, (base, bonus) => base + bonus + 100);
    expect(r.totalScore).toBe(1100);
  });
  it("scoring config has correct values", () => {
    expect(SCORING_CONFIG.baseScore).toBe(500); expect(SCORING_CONFIG.maxScore).toBe(1000);
  });
});

// ===== System 4 — Streaks & Combos =====
describe("Classic Quiz — Streaks", () => {
  it("starts with zero streak", () => {
    const s = createStreakState();
    expect(s.currentStreak).toBe(0); expect(s.longestStreak).toBe(0);
  });
  it("increments on correct", () => {
    let s = createStreakState();
    s = updateStreak(s, true, 5, 1);
    expect(s.currentStreak).toBe(1);
  });
  it("resets on wrong", () => {
    let s = createStreakState();
    s = updateStreak(s, true, 5, 1); s = updateStreak(s, true, 5, 2); s = updateStreak(s, false, 5, 3);
    expect(s.currentStreak).toBe(0); expect(s.longestStreak).toBe(2);
  });
  it("awards 3-streak bonus", () => {
    let s = createStreakState();
    s = updateStreak(s, true, 5, 1); s = updateStreak(s, true, 5, 2); s = updateStreak(s, true, 5, 3);
    expect(s.comboBonus).toBeGreaterThanOrEqual(50);
  });
  it("awards 5-streak bonus", () => {
    let s = createStreakState();
    for (let i = 0; i < 5; i++) s = updateStreak(s, true, 5, i + 1);
    expect(s.comboBonus).toBeGreaterThanOrEqual(150);
  });
  it("detects perfect round", () => {
    let s = createStreakState();
    for (let i = 0; i < 5; i++) s = updateStreak(s, true, 5, i + 1);
    expect(s.perfectRound).toBe(true);
  });
  it("checks milestones", () => {
    let s = createStreakState();
    s = updateStreak(s, true, 5, 1); s = updateStreak(s, true, 5, 2); s = updateStreak(s, true, 5, 3);
    const milestones = checkStreakMilestones(s);
    expect(milestones.find(m => m.id === "streak_3")?.achieved).toBe(true);
  });
});

// ===== System 5 — Leaderboards =====
describe("Classic Quiz — Leaderboards", () => {
  const players = [
    { userId: "p1", displayName: "Alice", score: 5000, correctAnswers: 10, totalAnswered: 12, avgResponseMs: 3000, longestStreak: 5, combo: 100 },
    { userId: "p2", displayName: "Bob", score: 3000, correctAnswers: 6, totalAnswered: 12, avgResponseMs: 5000, longestStreak: 3, combo: 50 },
    { userId: "p3", displayName: "Carol", score: 4500, correctAnswers: 9, totalAnswered: 12, avgResponseMs: 2500, longestStreak: 4, combo: 75 },
  ];
  it("sorts by score by default", () => {
    const lb = buildLeaderboard(players);
    expect(lb[0].userId).toBe("p1"); expect(lb[1].userId).toBe("p3"); expect(lb[2].userId).toBe("p2");
  });
  it("sorts by accuracy", () => {
    const lb = buildLeaderboard(players, "accuracy");
    expect(lb[0].userId).toBe("p1");
  });
  it("sorts by response time (fastest first)", () => {
    const lb = buildLeaderboard(players, "fastest_player");
    expect(lb[0].userId).toBe("p3");
  });
  it("sorts by longest streak", () => {
    const lb = buildLeaderboard(players, "longest_streak");
    expect(lb[0].userId).toBe("p1");
  });
  it("assigns ranks 1, 2, 3", () => {
    const lb = buildLeaderboard(players);
    expect(lb[0].rank).toBe(1); expect(lb[1].rank).toBe(2); expect(lb[2].rank).toBe(3);
  });
  it("calculates accuracy", () => {
    const lb = buildLeaderboard(players);
    expect(lb[0].accuracy).toBeCloseTo(0.83, 1);
  });
});

// ===== System 10 — Achievements =====
describe("Classic Quiz — Achievements", () => {
  it("has 11 achievements", () => { expect(ACHIEVEMENTS.length).toBe(11); });
  it("awards First Correct", () => {
    const achs = checkAchievements({ correctCount: 1, totalAnswered: 5, fastestMs: 3000, longestStreak: 1, rank: 1, perfectRound: false });
    expect(achs.some(a => a.id === "first_correct")).toBe(true);
  });
  it("awards Speed Master for under 3s", () => {
    const achs = checkAchievements({ correctCount: 5, totalAnswered: 5, fastestMs: 2500, longestStreak: 5, rank: 1, perfectRound: true });
    expect(achs.some(a => a.id === "speed_master")).toBe(true);
  });
  it("awards Champion for rank 1", () => {
    const achs = checkAchievements({ correctCount: 10, totalAnswered: 10, fastestMs: 5000, longestStreak: 10, rank: 1, perfectRound: true });
    expect(achs.some(a => a.id === "champion")).toBe(true);
  });
  it("calculates XP from achievements", () => {
    const achs = checkAchievements({ correctCount: 10, totalAnswered: 10, fastestMs: 1000, longestStreak: 10, rank: 1, perfectRound: true });
    const xp = calculateXP(achs);
    expect(xp).toBeGreaterThan(0);
  });
});

// ===== System 2 — Gameplay =====
describe("Classic Quiz — Gameplay", () => {
  it("starts a match", () => {
    expect(testMatchId).toBeTruthy();
    const m = getMatch(testMatchId);
    expect(m!.gameMode).toBe("classic_quiz");
  });
  it("runs question flow", () => {
    const result = runQuestionFlow(testMatchId, "q-1", 1, 0);
    expect(result.phase).toBe("question_reveal");
  });
  it("submits an answer", () => {
    runQuestionFlow(testMatchId, "q-1", 1, 0);
    const r = submitAnswer(testMatchId, "p1", "q-1", "A", 2000, true);
    expect(r.score).toBe(1000); expect(r.tier).toBe("perfect");
  });
  it("locks answers", () => {
    runQuestionFlow(testMatchId, "q-1", 1, 0);
    lockAnswers(testMatchId);
    expect(getEvents(testMatchId).some(e => e.type === "AnswerLocked")).toBe(true);
  });
});

// ===== System 6 — Teacher Controls =====
describe("Classic Quiz — Teacher Controls", () => {
  it("extends timer", () => {
    runQuestionFlow(testMatchId, "q-1", 1, 0);
    const r = executeTeacherAction(testMatchId, "teacher-1", "extend_timer", { extraMs: 10000 });
    expect(r.success).toBe(true); expect(r.audited).toBe(true);
  });
  it("skips question", () => {
    runQuestionFlow(testMatchId, "q-1", 1, 0);
    const r = executeTeacherAction(testMatchId, "teacher-1", "skip_question");
    expect(r.success).toBe(true);
  });
  it("ends match", () => {
    const r = executeTeacherAction(testMatchId, "teacher-1", "end_match");
    expect(r.success).toBe(true);
  });
  it("emergency stop cancels match", () => {
    const r = executeTeacherAction(testMatchId, "teacher-1", "emergency_stop");
    expect(r.success).toBe(true); expect(getMatch(testMatchId)!.state).toBe("cancelled");
  });
  it("rejects non-host", () => {
    const r = executeTeacherAction(testMatchId, "student-1", "pause_match");
    expect(r.success).toBe(false);
  });
  it("generates event for every action", () => {
    const before = getEvents(testMatchId).length;
    executeTeacherAction(testMatchId, "teacher-1", "lock_answers");
    const after = getEvents(testMatchId).length;
    expect(after).toBeGreaterThan(before);
  });
});

// ===== System 7 — Student UX =====
describe("Classic Quiz — Student UX", () => {
  it("returns joining state for unknown match", () => {
    expect(getStudentUXState("nonexistent", "p1")).toBe("joining");
  });
  it("returns waiting state in lobby", () => {
    expect(getStudentUXState(testMatchId, "teacher-1")).toBe("waiting");
  });
});

// ===== System 8 — Match Summary =====
describe("Classic Quiz — Match Summary", () => {
  it("generates a match summary", () => {
    const s = generateMatchSummary(testMatchId);
    expect(s).not.toBeNull(); expect(s!.top3.length).toBeLessThanOrEqual(3);
  });
  it("summary has XP earned", () => {
    const s = generateMatchSummary(testMatchId);
    expect(s!.xpEarned).toBeDefined();
  });
});

// ===== System 9 — Analytics =====
describe("Classic Quiz — Analytics", () => {
  it("generates match analytics", () => {
    const a = generateMatchAnalytics(testMatchId);
    expect(a).not.toBeNull(); expect(a!.perStudent.length).toBeGreaterThan(0);
  });
});

// ===== System 11 — Replay =====
describe("Classic Quiz — Replay", () => {
  it("generates replay timeline", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    const timeline = generateReplayTimeline(testMatchId);
    expect(timeline.length).toBeGreaterThan(0);
  });
});

// ===== System 12 — Anti-Cheat =====
describe("Classic Quiz — Anti-Cheat", () => {
  it("detects impossible speed", () => {
    const findings = checkClassicQuizCheats(testMatchId, "p1", 100, Date.now(), []);
    expect(findings.some(f => f.kind === "impossible_timestamp")).toBe(true);
  });
  it("detects duplicate answers", () => {
    const findings = checkClassicQuizCheats(testMatchId, "p1", 5000, Date.now(), [{ userId: "p1", questionIndex: 0 }, { userId: "p1", questionIndex: 0 }]);
    expect(findings.some(f => f.kind === "duplicate_submission")).toBe(true);
  });
  it("never auto-bans (only findings)", () => {
    const findings = checkClassicQuizCheats(testMatchId, "p1", 50, Date.now(), []);
    for (const f of findings) expect(f.severity).toMatch(/low|medium|high|critical/);
  });
});

// ===== System 13 — Accessibility =====
describe("Classic Quiz — Accessibility", () => {
  it("has all accessibility features", () => {
    expect(ACCESSIBILITY_CONFIG.keyboardNavigation).toBe(true);
    expect(ACCESSIBILITY_CONFIG.colorBlindFriendly).toBe(true);
    expect(ACCESSIBILITY_CONFIG.mobileFriendly).toBe(true);
  });
  it("getAccessibilityConfig returns a copy", () => {
    expect(getAccessibilityConfig()).not.toBe(ACCESSIBILITY_CONFIG);
  });
});

// ===== System 14 — Dashboard =====
describe("Classic Quiz — Dashboard", () => {
  it("generates teacher dashboard", () => {
    const d = generateTeacherDashboard(testMatchId);
    expect(d).not.toBeNull(); expect(d!.livePlayers).toBeGreaterThan(0);
  });
});

// ===== Extended checks =====
describe("Classic Quiz — Extended", () => {
  it("status report works", () => {
    const s = getClassicQuizStatus();
    expect(s).toHaveProperty("totalMatches");
  });
  it("scoring is deterministic", () => {
    const r1 = calculateScore({ isCorrect: true, responseTimeMs: 2000, thresholdMs: 30000 });
    const r2 = calculateScore({ isCorrect: true, responseTimeMs: 2000, thresholdMs: 30000 });
    expect(r1.totalScore).toBe(r2.totalScore);
  });
  it("all achievements have positive XP", () => {
    for (const a of ACHIEVEMENTS) expect(a.xpReward).toBeGreaterThan(0);
  });
  it("streak milestones have increasing thresholds", () => {
    const thresholds = STREAK_MILESTONES.map(m => m.threshold);
    for (let i = 1; i < thresholds.length; i++) expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
  });
  it("leaderboard handles empty players", () => {
    const lb = buildLeaderboard([]);
    expect(lb.length).toBe(0);
  });
  it("teacher action generates event ID", () => {
    const r = executeTeacherAction(testMatchId, "teacher-1", "mute_chat");
    expect(r.eventId).toBeTruthy();
  });
  it("match summary has teacher summary", () => {
    const s = generateMatchSummary(testMatchId);
    expect(s!.teacherSummary).toBeDefined();
    expect(s!.teacherSummary).toHaveProperty("interventions");
  });
  it("rules support 10000+ players", () => {
    expect(CLASSIC_QUIZ_RULES.maxPlayers).toBeGreaterThanOrEqual(10000);
  });
});
