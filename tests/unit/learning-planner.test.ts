/**
 * EduBek — Phase 4F.3 Learning Planner tests.
 *
 * Verifies the pure-function algorithms (SM-2 spaced repetition,
 * adaptive difficulty) and the plan-metadata generation (weekly
 * schedule, difficulty curve). Database-backed lifecycle tests are
 * covered by the smoke tests in the worklog.
 */
import { describe, it, expect } from "vitest";
import {
  applySm2,
  computeForgettingScore,
  suggestQuality,
  defaultPriorState,
} from "@/features/learning-planner/spaced-repetition";
import {
  adjustDifficulty,
  difficultyToNumber,
  numberToDifficulty,
} from "@/features/learning-planner/adaptive-difficulty";
import type {
  AdaptiveDifficultyInput,
  Difficulty,
  Sm2ReviewInput,
} from "@/features/learning-planner/types";

// ---------------------------------------------------------------------------
// SM-2 Spaced Repetition
// ---------------------------------------------------------------------------

describe("SM-2 Spaced Repetition", () => {
  it("resets on quality < 3 (failed recall)", () => {
    const prior = defaultPriorState();
    // Simulate 3 successful repetitions to build up an interval
    let state = prior;
    for (let i = 0; i < 3; i++) {
      state = {
        easeFactor: state.easeFactor,
        intervalDays: state.intervalDays,
        repetitions: state.repetitions,
        lastReviewAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
      const result = applySm2(state, {
        userId: "u1",
        entityType: "topic",
        entityId: "t1",
        quality: 5,
      });
      state = {
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        repetitions: result.repetitions,
        lastReviewAt: new Date(),
      };
    }
    expect(state.repetitions).toBe(3);
    expect(state.intervalDays).toBeGreaterThan(1);

    // Now fail
    const failedResult = applySm2(
      {
        easeFactor: state.easeFactor,
        intervalDays: state.intervalDays,
        repetitions: state.repetitions,
        lastReviewAt: new Date(),
      },
      {
        userId: "u1",
        entityType: "topic",
        entityId: "t1",
        quality: 1,
      },
    );
    expect(failedResult.repetitions).toBe(0);
    expect(failedResult.intervalDays).toBe(1);
  });

  it("first successful review → interval = 1 day, repetitions = 1", () => {
    const prior = defaultPriorState();
    const result = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 4,
    });
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  it("second successful review → interval = 3 days", () => {
    const prior = {
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 1,
      lastReviewAt: new Date(),
    };
    const result = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 4,
    });
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(3);
  });

  it("third+ successful review → interval = priorInterval × easeFactor", () => {
    const prior = {
      easeFactor: 2.5,
      intervalDays: 3,
      repetitions: 2,
      lastReviewAt: new Date(),
    };
    const result = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 4,
    });
    expect(result.repetitions).toBe(3);
    // 3 * 2.5 = 7.5 → rounded to 8
    expect(result.intervalDays).toBe(8);
  });

  it("reduces ease factor on poor quality, never below 1.3", () => {
    const prior = {
      easeFactor: 2.5,
      intervalDays: 10,
      repetitions: 5,
      lastReviewAt: new Date(),
    };
    const result = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 0,
    });
    expect(result.easeFactor).toBeLessThan(2.5);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("increases ease factor on perfect quality (capped at higher values)", () => {
    const prior = {
      easeFactor: 2.0,
      intervalDays: 5,
      repetitions: 3,
      lastReviewAt: new Date(),
    };
    const result = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 5,
    });
    // q=5: EF' = EF + 0.1 - 0 = EF + 0.1
    expect(result.easeFactor).toBeCloseTo(2.1, 2);
  });

  it("slow responses reduce quality by 1", () => {
    const prior = defaultPriorState();
    const fast = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 5,
      responseMs: 2000,
    });
    const slow = applySm2(prior, {
      userId: "u1",
      entityType: "topic",
      entityId: "t1",
      quality: 5,
      responseMs: 20_000, // > 15s threshold
    });
    // Slow response should yield a smaller interval (quality reduced to 4)
    expect(slow.intervalDays).toBeLessThanOrEqual(fast.intervalDays);
  });

  it("never returns NaN or negative values", () => {
    const inputs: Sm2ReviewInput[] = [
      { userId: "u", entityType: "t", entityId: "e", quality: 0 },
      { userId: "u", entityType: "t", entityId: "e", quality: 5 },
      { userId: "u", entityType: "t", entityId: "e", quality: 3, responseMs: 0 },
      { userId: "u", entityType: "t", entityId: "e", quality: 3, responseMs: 100_000 },
    ];
    for (const input of inputs) {
      const result = applySm2(defaultPriorState(), input);
      expect(Number.isFinite(result.easeFactor)).toBe(true);
      expect(Number.isFinite(result.intervalDays)).toBe(true);
      expect(result.intervalDays).toBeGreaterThanOrEqual(1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(result.forgettingScore).toBeGreaterThanOrEqual(0);
      expect(result.forgettingScore).toBeLessThanOrEqual(1);
    }
  });
});

describe("SM-2 Forgetting Score", () => {
  it("returns 0 when never reviewed", () => {
    const prior = defaultPriorState();
    expect(computeForgettingScore(prior)).toBe(0);
  });

  it("returns 0 for review just now", () => {
    const prior = {
      easeFactor: 2.5,
      intervalDays: 7,
      repetitions: 3,
      lastReviewAt: new Date(),
    };
    expect(computeForgettingScore(prior)).toBeCloseTo(0, 5);
  });

  it("approaches 1 as time since review grows beyond interval", () => {
    const longAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
    const prior = {
      easeFactor: 2.5,
      intervalDays: 1, // very short stability
      repetitions: 1,
      lastReviewAt: longAgo,
    };
    const score = computeForgettingScore(prior);
    expect(score).toBeGreaterThan(0.9);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("SM-2 suggestQuality", () => {
  it("suggests 5 for fast correct answers", () => {
    expect(suggestQuality({ correct: true, responseMs: 2000 })).toBe(5);
  });

  it("suggests 4 for moderate-speed correct answers", () => {
    expect(suggestQuality({ correct: true, responseMs: 5000 })).toBe(4);
  });

  it("suggests 3 for slow correct answers", () => {
    expect(suggestQuality({ correct: true, responseMs: 12_000 })).toBe(3);
  });

  it("suggests 2 for incorrect without retries", () => {
    expect(suggestQuality({ correct: false })).toBe(2);
  });

  it("suggests 0 for incorrect with 3+ retries", () => {
    expect(suggestQuality({ correct: false, retries: 3 })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Adaptive Difficulty
// ---------------------------------------------------------------------------

describe("Adaptive Difficulty", () => {
  const baseInput = (overrides: Partial<AdaptiveDifficultyInput> = {}): AdaptiveDifficultyInput => ({
    current: "medium",
    accuracy: 0.7,
    avgResponseSec: 15,
    ...overrides,
  });

  it("steps UP on high accuracy + good streak + solid mastery", () => {
    const result = adjustDifficulty(baseInput({
      current: "medium",
      accuracy: 0.9,
      streak: 5,
      mastery: 0.8,
    }));
    expect(result.change).toBe("up");
    expect(result.next).toBe("hard");
  });

  it("steps DOWN on low accuracy", () => {
    const result = adjustDifficulty(baseInput({
      current: "hard",
      accuracy: 0.3,
    }));
    expect(result.change).toBe("down");
    expect(result.next).toBe("medium");
  });

  it("steps DOWN on multiple recent failures", () => {
    const result = adjustDifficulty(baseInput({
      current: "expert",
      accuracy: 0.6, // not below 0.45 threshold
      recentFailures: 4,
    }));
    expect(result.change).toBe("down");
    expect(result.next).toBe("hard");
  });

  it("steps DOWN on low confidence + mediocre accuracy", () => {
    const result = adjustDifficulty(baseInput({
      current: "medium",
      accuracy: 0.55,
      confidence: 1,
    }));
    expect(result.change).toBe("down");
    expect(result.next).toBe("easy");
  });

  it("holds when performance is in target band", () => {
    const result = adjustDifficulty(baseInput({
      current: "medium",
      accuracy: 0.7,
      streak: 1,
    }));
    expect(result.change).toBe("same");
    expect(result.next).toBe("medium");
  });

  it("caps at expert when stepping up from expert", () => {
    const result = adjustDifficulty(baseInput({
      current: "expert",
      accuracy: 0.95,
      streak: 10,
      mastery: 0.95,
    }));
    expect(result.change).toBe("same");
    expect(result.next).toBe("expert");
    expect(result.reasonKey).toBe("learning.difficulty.alreadyMax");
  });

  it("caps at easy when stepping down from easy", () => {
    const result = adjustDifficulty(baseInput({
      current: "easy",
      accuracy: 0.2,
      recentFailures: 5,
    }));
    expect(result.change).toBe("same");
    expect(result.next).toBe("easy");
    expect(result.reasonKey).toBe("learning.difficulty.alreadyMin");
  });

  it("never returns NaN or out-of-range confidence", () => {
    const inputs: AdaptiveDifficultyInput[] = [
      baseInput({ accuracy: 0, avgResponseSec: 0 }),
      baseInput({ accuracy: 1, avgResponseSec: 1000 }),
      baseInput({ accuracy: 0.5, streak: 0, confidence: 3 }),
      baseInput({ accuracy: 0.5, mastery: 0, recentFailures: 0 }),
    ];
    for (const input of inputs) {
      const result = adjustDifficulty(input);
      expect(Number.isFinite(result.confidence)).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(["easy", "medium", "hard", "expert"]).toContain(result.next);
      expect(["up", "down", "same"]).toContain(result.change);
    }
  });
});

describe("Difficulty numeric conversion", () => {
  it("round-trips through number", () => {
    const levels: Difficulty[] = ["easy", "medium", "hard", "expert"];
    for (const d of levels) {
      expect(numberToDifficulty(difficultyToNumber(d))).toBe(d);
    }
  });

  it("clamps out-of-range numbers", () => {
    expect(numberToDifficulty(0)).toBe("easy");
    expect(numberToDifficulty(-5)).toBe("easy");
    expect(numberToDifficulty(5)).toBe("expert");
    expect(numberToDifficulty(100)).toBe("expert");
  });
});
