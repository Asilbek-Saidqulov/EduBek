import { describe, it, expect } from "vitest";
import { checkAnswerCorrectness, calculateAuthoritativeScore, sortAndRankPlayers } from "../scoring";
import type { AuthoritativeQuestion, AuthoritativePlayer } from "../types";

describe("Multiplayer Scoring", () => {
  const baseQuestion: AuthoritativeQuestion = {
    id: "q1",
    prompt: "Test question",
    type: "multiple_choice",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    correctAnswer: "B",
    explanation: "Because B is correct",
    points: 1,
    durationMs: 30000,
  };

  describe("checkAnswerCorrectness", () => {
    it("returns true for correct multiple_choice index", () => {
      expect(checkAnswerCorrectness(baseQuestion, 1)).toBe(true);
    });

    it("returns false for wrong multiple_choice index", () => {
      expect(checkAnswerCorrectness(baseQuestion, 0)).toBe(false);
    });

    it("returns true for correct multiple_choice string", () => {
      expect(checkAnswerCorrectness(baseQuestion, "B")).toBe(true);
    });

    it("returns false for wrong multiple_choice string", () => {
      expect(checkAnswerCorrectness(baseQuestion, "A")).toBe(false);
    });

    it("returns true for correct true_false", () => {
      const q: AuthoritativeQuestion = {
        ...baseQuestion,
        type: "true_false",
        correctAnswer: "true",
        options: ["True", "False"],
      };
      expect(checkAnswerCorrectness(q, "true")).toBe(true);
      expect(checkAnswerCorrectness(q, "1")).toBe(true);
      expect(checkAnswerCorrectness(q, "t")).toBe(true);
    });

    it("returns false for wrong true_false", () => {
      const q: AuthoritativeQuestion = {
        ...baseQuestion,
        type: "true_false",
        correctAnswer: "true",
        options: ["True", "False"],
      };
      expect(checkAnswerCorrectness(q, "false")).toBe(false);
    });

    it("returns true for correct short_answer", () => {
      const q: AuthoritativeQuestion = {
        ...baseQuestion,
        type: "short_answer",
        correctAnswer: "Tashkent",
        acceptableAnswers: ["Tashkent", "Toshkent"],
      };
      expect(checkAnswerCorrectness(q, "Tashkent")).toBe(true);
      expect(checkAnswerCorrectness(q, "tashkent")).toBe(true);
      expect(checkAnswerCorrectness(q, "Toshkent")).toBe(true);
    });

    it("returns false for wrong short_answer", () => {
      const q: AuthoritativeQuestion = {
        ...baseQuestion,
        type: "short_answer",
        correctAnswer: "Tashkent",
      };
      expect(checkAnswerCorrectness(q, "Samarkand")).toBe(false);
    });

    it("returns true for correct multiple_select", () => {
      const q: AuthoritativeQuestion = {
        ...baseQuestion,
        type: "multiple_select",
        acceptableAnswers: ["A", "C"],
        options: ["A", "B", "C", "D"],
      };
      expect(checkAnswerCorrectness(q, ["A", "C"])).toBe(true);
    });

    it("returns false for wrong multiple_select", () => {
      const q: AuthoritativeQuestion = {
        ...baseQuestion,
        type: "multiple_select",
        acceptableAnswers: ["A", "C"],
        options: ["A", "B", "C", "D"],
      };
      expect(checkAnswerCorrectness(q, ["A", "B"])).toBe(false);
    });

    it("returns false for null/undefined answer", () => {
      expect(checkAnswerCorrectness(baseQuestion, null)).toBe(false);
      expect(checkAnswerCorrectness(baseQuestion, undefined)).toBe(false);
    });
  });

  describe("calculateAuthoritativeScore", () => {
    it("returns 0 for incorrect answer", () => {
      const result = calculateAuthoritativeScore(baseQuestion, 0, 5000, 0);
      expect(result.isCorrect).toBe(false);
      expect(result.totalPoints).toBe(0);
    });

    it("calculates base points correctly", () => {
      const result = calculateAuthoritativeScore(baseQuestion, 1, 5000, 0);
      expect(result.isCorrect).toBe(true);
      expect(result.basePoints).toBe(1000);
    });

    it("gives speed bonus for fast answer", () => {
      const result = calculateAuthoritativeScore(baseQuestion, 1, 1000, 0);
      expect(result.isCorrect).toBe(true);
      expect(result.speedBonus).toBeGreaterThan(0);
      expect(result.totalPoints).toBeGreaterThan(1000);
    });

    it("gives no speed bonus for slow answer", () => {
      const result = calculateAuthoritativeScore(baseQuestion, 1, 29000, 0);
      expect(result.isCorrect).toBe(true);
      expect(result.speedBonus).toBeGreaterThanOrEqual(0);
      expect(result.totalPoints).toBeGreaterThanOrEqual(1000);
    });

    it("gives streak bonus for streaks >= 3", () => {
      const result = calculateAuthoritativeScore(baseQuestion, 1, 5000, 2);
      expect(result.isCorrect).toBe(true);
      expect(result.streakBonus).toBeGreaterThanOrEqual(100);
      expect(result.totalPoints).toBeGreaterThan(1000);
    });

    it("caps streak bonus at 500", () => {
      const result = calculateAuthoritativeScore(baseQuestion, 1, 5000, 7);
      expect(result.isCorrect).toBe(true);
      expect(result.streakBonus).toBe(500);
      expect(result.totalPoints).toBeGreaterThanOrEqual(1500);
    });

    it("scales base points with question.points", () => {
      const q: AuthoritativeQuestion = { ...baseQuestion, points: 2 };
      const result = calculateAuthoritativeScore(q, 1, 5000, 0);
      expect(result.basePoints).toBe(2000);
    });
  });

  describe("sortAndRankPlayers", () => {
    const makePlayer = (overrides: Partial<AuthoritativePlayer> = {}): AuthoritativePlayer => ({
      id: overrides.id || "p1",
      userId: overrides.userId || "u1",
      socketId: overrides.socketId || "s1",
      displayName: overrides.displayName || "Player 1",
      role: overrides.role || "player",
      status: overrides.status || "active",
      isGuest: overrides.isGuest ?? false,
      score: overrides.score ?? 0,
      accuracy: overrides.accuracy ?? 0,
      correctCount: overrides.correctCount ?? 0,
      wrongCount: overrides.wrongCount ?? 0,
      currentStreak: overrides.currentStreak ?? 0,
      longestStreak: overrides.longestStreak ?? 0,
      avgResponseMs: overrides.avgResponseMs ?? 0,
      totalResponseMs: overrides.totalResponseMs ?? 0,
      answeredCount: overrides.answeredCount ?? 0,
      isReady: overrides.isReady ?? false,
      hasAnsweredCurrentRound: overrides.hasAnsweredCurrentRound ?? false,
      lastPointsEarned: overrides.lastPointsEarned ?? 0,
      joinedAt: overrides.joinedAt ?? new Date("2024-01-01"),
      lastSeenAt: overrides.lastSeenAt ?? new Date(),
      disconnectedAt: overrides.disconnectedAt ?? null,
    });

    it("ranks by score descending", () => {
      const players = [
        makePlayer({ id: "p1", score: 100 }),
        makePlayer({ id: "p2", score: 200 }),
        makePlayer({ id: "p3", score: 150 }),
      ];
      const ranked = sortAndRankPlayers(players);
      expect(ranked[0].playerId).toBe("p2");
      expect(ranked[1].playerId).toBe("p3");
      expect(ranked[2].playerId).toBe("p1");
    });

    it("breaks ties by correctCount descending", () => {
      const players = [
        makePlayer({ id: "p1", score: 100, correctCount: 2 }),
        makePlayer({ id: "p2", score: 100, correctCount: 5 }),
      ];
      const ranked = sortAndRankPlayers(players);
      expect(ranked[0].playerId).toBe("p2");
    });

    it("breaks ties by avgResponseMs ascending", () => {
      const players = [
        makePlayer({ id: "p1", score: 100, correctCount: 2, avgResponseMs: 5000 }),
        makePlayer({ id: "p2", score: 100, correctCount: 2, avgResponseMs: 3000 }),
      ];
      const ranked = sortAndRankPlayers(players);
      expect(ranked[0].playerId).toBe("p2");
    });

    it("computes rank change correctly", () => {
      const players = [
        makePlayer({ id: "p1", score: 100 }),
        makePlayer({ id: "p2", score: 200 }),
      ];
      const previousRanks = new Map<string, number>([["p1", 1], ["p2", 2]]);
      const ranked = sortAndRankPlayers(players, previousRanks);
      expect(ranked[0].playerId).toBe("p2");
      expect(ranked[0].change).toBe(1); // climbed from 2nd to 1st
      expect(ranked[1].playerId).toBe("p1");
      expect(ranked[1].change).toBe(-1); // dropped from 1st to 2nd
    });

    it("is deterministic with playerId tie-breaker", () => {
      const players = [
        makePlayer({ id: "p2", score: 100, correctCount: 2, avgResponseMs: 3000, joinedAt: new Date("2024-01-01") }),
        makePlayer({ id: "p1", score: 100, correctCount: 2, avgResponseMs: 3000, joinedAt: new Date("2024-01-01") }),
      ];
      const ranked = sortAndRankPlayers(players);
      expect(ranked[0].playerId).toBe("p1");
    });
  });
});
