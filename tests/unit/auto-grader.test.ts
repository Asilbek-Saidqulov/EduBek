/**
 * EduBek — Test: Auto-grader.
 *
 * Phase 4D.7 — Testing infrastructure.
 * Verifies the grading pipeline for all 6 auto-gradable question types.
 */
import { describe, it, expect } from "vitest";
import { gradeResponse, batchGradeResponses } from "@/features/assessment/auto-grader";

describe("Auto-grader", () => {
  describe("multiple_choice", () => {
    const payload = { prompt: "2+2?", options: ["3", "4", "5", "6"], correctIndex: 1 };

    it("should award full points for correct answer", () => {
      const result = gradeResponse("multiple_choice", payload, 1, 10);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsAwarded).toBe(10);
    });

    it("should award 0 for wrong answer", () => {
      const result = gradeResponse("multiple_choice", payload, 0, 10);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsAwarded).toBe(0);
    });
  });

  describe("true_false", () => {
    const payload = { prompt: "The sky is blue", correct: true };

    it("should grade correct boolean answer", () => {
      const result = gradeResponse("true_false", payload, true, 5);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsAwarded).toBe(5);
    });

    it("should grade wrong boolean answer", () => {
      const result = gradeResponse("true_false", payload, false, 5);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsAwarded).toBe(0);
    });
  });

  describe("matching", () => {
    const payload = {
      prompt: "Match capitals",
      pairs: [
        { left: "France", right: "Paris" },
        { left: "Italy", right: "Rome" },
        { left: "Spain", right: "Madrid" },
      ],
    };

    it("should pro-rate points for partial matches", () => {
      // Correctly matches pair 0 and 2, but not 1
      const answer = { "0": 0, "1": 2, "2": 2 };
      const result = gradeResponse("matching", payload, answer, 30);
      expect(result.isCorrect).toBe(false);
      // 2/3 pairs correct → 20 out of 30
      expect(result.pointsAwarded).toBe(20);
    });

    it("should award full points for all correct", () => {
      const answer = { "0": 0, "1": 1, "2": 2 };
      const result = gradeResponse("matching", payload, answer, 30);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsAwarded).toBe(30);
    });
  });

  describe("essay (manual grading)", () => {
    const payload = { prompt: "Write an essay about..." };

    it("should return autoGradable=false for essays", () => {
      const result = gradeResponse("essay", payload, "some text", 100);
      expect(result.autoGradable).toBe(false);
      expect(result.pointsAwarded).toBe(0);
    });
  });

  describe("batch grading", () => {
    it("should grade multiple responses in one pass", () => {
      const items = [
        {
          responseId: "r1",
          questionType: "multiple_choice" as const,
          payload: { prompt: "q1", options: ["a", "b"], correctIndex: 0 },
          answer: 0,
          pointsMax: 10,
        },
        {
          responseId: "r2",
          questionType: "true_false" as const,
          payload: { prompt: "q2", correct: true },
          answer: true,
          pointsMax: 5,
        },
        {
          responseId: "r3",
          questionType: "essay" as const,
          payload: { prompt: "q3" },
          answer: "some text",
          pointsMax: 20,
        },
      ];
      const result = batchGradeResponses(items);
      expect(result.updates).toHaveLength(2); // essay excluded
      expect(result.totalAwarded).toBe(15); // 10 + 5
      expect(result.totalMax).toBe(35); // 10 + 5 + 20
      expect(result.needsManualCount).toBe(1); // essay
    });
  });
});
