/**
 * EduBek — Adaptive Difficulty Engine.
 *
 * Phase 4F.3: Automatically increase or decrease the difficulty of
 * the next learning item based on the learner's recent performance
 * signals — no manual configuration required.
 *
 * Inputs:
 *   • accuracy (0-1)         — fraction of correct answers in recent attempts
 *   • avgResponseSec         — average response time in seconds
 *   • confidence (1-5)       — learner's subjective confidence (optional)
 *   • streak (≥0)            — consecutive correct answers (optional)
 *   • mastery (0-1)          — current mastery of the topic (optional)
 *   • recentFailures (≥0)    — failures in the last 5 attempts (optional)
 *
 * Decision logic:
 *   1. If accuracy ≥ 0.85 AND streak ≥ 3 AND mastery ≥ 0.7 → step UP.
 *   2. If accuracy ≤ 0.45 OR recentFailures ≥ 3 → step DOWN.
 *   3. If confidence ≤ 2 AND accuracy < 0.6 → step DOWN (learner is unsure).
 *   4. Otherwise hold difficulty.
 *
 * Each step changes one difficulty level. We never jump two levels at
 * once — gradual adjustment keeps the learner in their zone of
 * proximal development.
 *
 * Returns a structured AdaptiveDifficultyResult with reason + reasonKey
 * (for i18n) + confidence (how sure the engine is about the change).
 */
import type { AdaptiveDifficultyInput, AdaptiveDifficultyResult, Difficulty } from "./types";

// ---------------------------------------------------------------------------
// Difficulty ladder
// ---------------------------------------------------------------------------

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

function stepUp(d: Difficulty): Difficulty {
  const i = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, i + 1)]!;
}

function stepDown(d: Difficulty): Difficulty {
  const i = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.max(0, i - 1)]!;
}

// ---------------------------------------------------------------------------
// Core adjustment function (pure, no side effects)
// ---------------------------------------------------------------------------

export function adjustDifficulty(input: AdaptiveDifficultyInput): AdaptiveDifficultyResult {
  const accuracy = clamp01(input.accuracy);
  const mastery = input.mastery !== undefined ? clamp01(input.mastery) : undefined;
  const streak = input.streak ?? 0;
  const recentFailures = input.recentFailures ?? 0;
  const confidence = input.confidence;
  const avgResponseSec = input.avgResponseSec;

  // --- Rule 1: step UP ---
  // High accuracy + good streak + solid mastery → challenge them more.
  const highAccuracy = accuracy >= 0.85;
  const goodStreak = streak >= 3;
  const solidMastery = mastery === undefined || mastery >= 0.7;
  if (highAccuracy && goodStreak && solidMastery) {
    const next = stepUp(input.current);
    if (next === input.current) {
      return {
        next,
        reason: "Already at maximum difficulty — holding at expert.",
        reasonKey: "learning.difficulty.alreadyMax",
        change: "same",
        confidence: 0.9,
      };
    }
    return {
      next,
      reason: `Accuracy ${(accuracy * 100).toFixed(0)}% with a ${streak}-correct streak — ready for a harder challenge.`,
      reasonKey: "learning.difficulty.stepUp",
      change: "up",
      confidence: 0.85,
    };
  }

  // --- Rule 2: step DOWN ---
  // Low accuracy OR multiple recent failures.
  const lowAccuracy = accuracy <= 0.45;
  const manyFailures = recentFailures >= 3;
  if (lowAccuracy || manyFailures) {
    const next = stepDown(input.current);
    if (next === input.current) {
      return {
        next,
        reason: "Already at minimum difficulty — holding at easy.",
        reasonKey: "learning.difficulty.alreadyMin",
        change: "same",
        confidence: 0.9,
      };
    }
    const reason = manyFailures
      ? `${recentFailures} recent failures — stepping back to consolidate understanding.`
      : `Accuracy ${(accuracy * 100).toFixed(0)}% is below 45% — reducing difficulty to rebuild confidence.`;
    return {
      next,
      reason,
      reasonKey: manyFailures
        ? "learning.difficulty.stepDownFailures"
        : "learning.difficulty.stepDownAccuracy",
      change: "down",
      confidence: 0.8,
    };
  }

  // --- Rule 3: low confidence override ---
  // Learner is unsure AND accuracy is below 60% — step DOWN even if
  // accuracy hasn't crossed the 45% threshold yet.
  if (confidence !== undefined && confidence <= 2 && accuracy < 0.6) {
    const next = stepDown(input.current);
    if (next !== input.current) {
      return {
        next,
        reason: `Confidence ${confidence}/5 with accuracy ${(accuracy * 100).toFixed(0)}% — easing back to rebuild confidence.`,
        reasonKey: "learning.difficulty.stepDownConfidence",
        change: "down",
        confidence: 0.7,
      };
    }
  }

  // --- Rule 4: hold ---
  // Slow responses slightly nudge confidence down but don't trigger a change.
  const slowResponse = avgResponseSec > 30;
  return {
    next: input.current,
    reason: slowResponse
      ? `Holding at ${input.current} — responses are slow but accuracy is acceptable.`
      : `Holding at ${input.current} — performance is in the target band.`,
    reasonKey: slowResponse
      ? "learning.difficulty.holdSlow"
      : "learning.difficulty.hold",
    change: "same",
    confidence: slowResponse ? 0.55 : 0.7,
  };
}

// ---------------------------------------------------------------------------
// Difficulty → numeric mapping (for analytics)
// ---------------------------------------------------------------------------

export function difficultyToNumber(d: Difficulty): number {
  switch (d) {
    case "easy": return 1;
    case "medium": return 2;
    case "hard": return 3;
    case "expert": return 4;
  }
}

export function numberToDifficulty(n: number): Difficulty {
  const i = Math.max(0, Math.min(3, Math.round(n) - 1));
  return DIFFICULTY_ORDER[i]!;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
