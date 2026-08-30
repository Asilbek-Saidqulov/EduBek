import { describe, it, expect } from "vitest";
import { validateAnswerTiming, sanitizeAndValidateAnswerFormat, checkActionRateLimit } from "../anti-cheat";
import type { AuthoritativeQuestion } from "../types";

describe("Multiplayer Anti-Cheat", () => {
  describe("validateAnswerTiming", () => {
    const start = new Date("2024-01-01T00:00:00.000Z");
    const lock = new Date("2024-01-01T00:00:30.000Z");

    it("accepts answer within window", () => {
      const result = validateAnswerTiming(start, lock, new Date("2024-01-01T00:00:10.000Z"));
      expect(result.valid).toBe(true);
      expect(result.responseMs).toBe(10000);
    });

    it("rejects answer before start", () => {
      const result = validateAnswerTiming(start, lock, new Date("2023-12-31T23:59:59.999Z"));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("before");
    });

    it("rejects answer after deadline", () => {
      const result = validateAnswerTiming(start, lock, new Date("2024-01-01T00:00:31.000Z"));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("deadline");
    });

    it("accepts answer exactly at deadline with grace tolerance", () => {
      const result = validateAnswerTiming(start, lock, new Date("2024-01-01T00:00:30.500Z"));
      expect(result.valid).toBe(true);
    });

    it("rejects answer beyond grace tolerance", () => {
      const result = validateAnswerTiming(start, lock, new Date("2024-01-01T00:00:31.600Z"));
      expect(result.valid).toBe(false);
    });
  });

  describe("sanitizeAndValidateAnswerFormat", () => {
    const mcQuestion: AuthoritativeQuestion = {
      id: "q1",
      prompt: "Test",
      type: "multiple_choice",
      options: ["A", "B", "C", "D"],
      points: 1,
      durationMs: 30000,
    };

    it("accepts valid multiple_choice index", () => {
      const result = sanitizeAndValidateAnswerFormat(mcQuestion, 1);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe(1);
    });

    it("rejects out-of-bounds multiple_choice index", () => {
      const result = sanitizeAndValidateAnswerFormat(mcQuestion, 10);
      expect(result.valid).toBe(false);
    });

    it("accepts valid multiple_choice string", () => {
      const result = sanitizeAndValidateAnswerFormat(mcQuestion, "B");
      expect(result.valid).toBe(true);
    });

    it("rejects multiple_choice string over 500 chars", () => {
      const result = sanitizeAndValidateAnswerFormat(mcQuestion, "A".repeat(501));
      expect(result.valid).toBe(false);
    });

    it("accepts valid true_false", () => {
      const q: AuthoritativeQuestion = { ...mcQuestion, type: "true_false", options: ["True", "False"] };
      expect(sanitizeAndValidateAnswerFormat(q, "true").valid).toBe(true);
      expect(sanitizeAndValidateAnswerFormat(q, false).valid).toBe(true);
      expect(sanitizeAndValidateAnswerFormat(q, 1).valid).toBe(true);
    });

    it("accepts valid short_answer", () => {
      const q: AuthoritativeQuestion = { ...mcQuestion, type: "short_answer" };
      expect(sanitizeAndValidateAnswerFormat(q, "Tashkent").valid).toBe(true);
    });

    it("rejects short_answer over 500 chars", () => {
      const q: AuthoritativeQuestion = { ...mcQuestion, type: "short_answer" };
      const result = sanitizeAndValidateAnswerFormat(q, "A".repeat(501));
      expect(result.valid).toBe(false);
    });

    it("accepts valid multiple_select array", () => {
      const q: AuthoritativeQuestion = { ...mcQuestion, type: "multiple_select" };
      expect(sanitizeAndValidateAnswerFormat(q, ["A", "C"]).valid).toBe(true);
    });

    it("rejects non-array for multiple_select", () => {
      const q: AuthoritativeQuestion = { ...mcQuestion, type: "multiple_select" };
      expect(sanitizeAndValidateAnswerFormat(q, "A").valid).toBe(false);
    });

    it("rejects null/undefined answer", () => {
      expect(sanitizeAndValidateAnswerFormat(mcQuestion, null).valid).toBe(false);
      expect(sanitizeAndValidateAnswerFormat(mcQuestion, undefined).valid).toBe(false);
    });
  });

  describe("checkActionRateLimit", () => {
    it("allows request within limit", () => {
      expect(checkActionRateLimit("test-id", 3, 1000)).toBe(true);
    });

    it("blocks request after limit exceeded", () => {
      expect(checkActionRateLimit("test-id-2", 2, 1000)).toBe(true);
      expect(checkActionRateLimit("test-id-2", 2, 1000)).toBe(true);
      expect(checkActionRateLimit("test-id-2", 2, 1000)).toBe(false);
    });

    it("resets after window expires", async () => {
      expect(checkActionRateLimit("test-id-3", 1, 50)).toBe(true);
      expect(checkActionRateLimit("test-id-3", 1, 50)).toBe(false);
      await new Promise((r) => setTimeout(r, 60));
      expect(checkActionRateLimit("test-id-3", 1, 50)).toBe(true);
    });
  });
});
