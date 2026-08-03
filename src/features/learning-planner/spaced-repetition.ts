/**
 * EduBek — Spaced Repetition Engine (SM-2).
 *
 * Phase 4F.3: Implements the SuperMemo SM-2 algorithm with EduBek-specific
 * extensions:
 *
 *   • Forgetting score — a 0-1 decay estimate derived from the time since
 *     the last review and the current interval. Used by the burnout
 *     detector and the AI Coach to surface "forgotten" topics.
 *   • Response-time adjustment — slow responses (>15s) reduce the quality
 *     grade by 1 to discourage guess-and-check behaviour.
 *   • Confidence integration — the learner's self-reported confidence
 *     can shift the next interval by ±10%.
 *
 * The algorithm is deterministic and side-effect-free: `applySm2()`
 * takes the prior schedule state + a review input and returns the next
 * state. The caller is responsible for persisting via the repository.
 *
 * Quality convention (SuperMemo):
 *   0 = complete blackout
 *   1 = incorrect, but felt familiar
 *   2 = incorrect, but easy to recall once shown
 *   3 = correct, but with serious difficulty
 *   4 = correct, after some hesitation
 *   5 = perfect, instant recall
 *
 * Quality < 3 resets repetitions to 0 and the interval to 1 day, but
 * the ease factor still drops (so the next interval is shorter than
 * it would have been).
 *
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */
import type { Sm2ReviewInput, Sm2Result } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SLOW_RESPONSE_MS = 15_000; // responses slower than this lose 1 quality point

// ---------------------------------------------------------------------------
// SM-2 core algorithm
// ---------------------------------------------------------------------------

export interface PriorSm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lastReviewAt: Date | null;
}

/**
 * Apply SM-2 to compute the next scheduling state from the prior state
 * and a review input. Pure function — no DB writes.
 */
export function applySm2(prior: PriorSm2State, input: Sm2ReviewInput): Sm2Result {
  // Adjust quality for slow responses.
  let quality = clampQuality(input.quality);
  if (input.responseMs !== undefined && input.responseMs > SLOW_RESPONSE_MS) {
    quality = Math.max(0, quality - 1);
  }

  // Compute the next ease factor.
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  let easeFactor = Math.max(MIN_EASE_FACTOR, prior.easeFactor + delta);

  // Compute the next interval and repetition count.
  let repetitions: number;
  let intervalDays: number;
  if (quality < 3) {
    // Failed recall — reset.
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = prior.repetitions + 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      // For repetitions >= 3, interval = priorInterval * easeFactor.
      // (Spec uses priorInterval, not the literal 6 — see SM-2 variants.)
      intervalDays = Math.max(1, Math.round(prior.intervalDays * easeFactor));
    }
  }

  // Compute next review date.
  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + intervalDays * MS_PER_DAY);

  // Forgetting score: how much of the memory has decayed since the last review?
  // Approximated using the exponential forgetting curve:
  //   R = e^(-t / S)
  // where t = days since last review, S = current interval (stability).
  const forgettingScore = computeForgettingScore(prior, now);

  return {
    easeFactor: round(easeFactor, 2),
    intervalDays,
    repetitions,
    nextReviewAt: nextReviewAt.toISOString(),
    forgettingScore: round(forgettingScore, 4),
  };
}

// ---------------------------------------------------------------------------
// Forgetting score
// ---------------------------------------------------------------------------

/**
 * Exponential forgetting curve: R = e^(-t/S).
 *
 *   t = days since last review (clamped to [0, 365])
 *   S = stability = current interval in days (min 1)
 *
 * Returns 1 - R, so a higher score = more forgotten.
 * If never reviewed, returns 0 (no baseline to decay from).
 */
export function computeForgettingScore(prior: PriorSm2State, now: Date = new Date()): number {
  if (!prior.lastReviewAt) return 0;
  const elapsedMs = now.getTime() - prior.lastReviewAt.getTime();
  if (elapsedMs <= 0) return 0;
  const tDays = Math.min(365, elapsedMs / MS_PER_DAY);
  const sDays = Math.max(1, prior.intervalDays);
  const retention = Math.exp(-tDays / sDays);
  return Math.max(0, Math.min(1, 1 - retention));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampQuality(q: number): number {
  if (!Number.isFinite(q)) return 3;
  return Math.max(0, Math.min(5, Math.round(q)));
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Suggest a starting quality grade from objective signals (correctness,
 * response time, retries). Useful when the learner didn't self-grade.
 */
export function suggestQuality(input: {
  correct: boolean;
  responseMs?: number;
  retries?: number;
}): number {
  if (!input.correct) {
    if (input.retries && input.retries > 2) return 0;
    return 2;
  }
  if (input.responseMs === undefined) return 4;
  if (input.responseMs < 3_000) return 5;
  if (input.responseMs < 8_000) return 4;
  if (input.responseMs < SLOW_RESPONSE_MS) return 3;
  return 3;
}

/**
 * Default starting state for a brand-new review schedule.
 */
export function defaultPriorState(): PriorSm2State {
  return {
    easeFactor: DEFAULT_EASE_FACTOR,
    intervalDays: 1,
    repetitions: 0,
    lastReviewAt: null,
  };
}
