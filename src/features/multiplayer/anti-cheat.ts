import { AuthoritativeQuestion } from "./types";

export interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

/**
 * Validates timing for answer submission against authoritative server timestamps.
 */
export function validateAnswerTiming(
  roundStartedAt: Date,
  roundLockAt: Date,
  submissionServerTime: Date,
  graceToleranceMs: number = 500
): { valid: boolean; error?: string; responseMs: number } {
  const startTime = roundStartedAt.getTime();
  const lockTime = roundLockAt.getTime() + graceToleranceMs;
  const now = submissionServerTime.getTime();

  if (now < startTime) {
    return {
      valid: false,
      error: "Answer submitted before question officially started",
      responseMs: 0,
    };
  }

  if (now > lockTime) {
    return {
      valid: false,
      error: "Answer submitted after round deadline",
      responseMs: now - startTime,
    };
  }

  const responseMs = Math.max(0, now - startTime);
  return {
    valid: true,
    responseMs,
  };
}

/**
 * Validates the format of the answer based on the question type.
 */
export function sanitizeAndValidateAnswerFormat(
  question: AuthoritativeQuestion,
  rawAnswer: unknown
): { valid: boolean; sanitized: string | number | string[]; error?: string } {
  if (rawAnswer === undefined || rawAnswer === null) {
    return { valid: false, sanitized: "", error: "Missing answer payload" };
  }

  switch (question.type) {
    case "multiple_choice": {
      if (typeof rawAnswer === "number") {
        if (!Number.isInteger(rawAnswer) || rawAnswer < 0 || rawAnswer >= question.options.length) {
          return { valid: false, sanitized: 0, error: "Option index out of bounds" };
        }
        return { valid: true, sanitized: rawAnswer };
      }

      if (typeof rawAnswer === "string") {
        const trimmed = rawAnswer.trim();
        if (trimmed.length > 500) {
          return { valid: false, sanitized: "", error: "Answer length exceeds limit" };
        }
        return { valid: true, sanitized: trimmed };
      }

      return { valid: false, sanitized: "", error: "Invalid multiple choice answer format" };
    }

    case "true_false": {
      if (typeof rawAnswer === "boolean" || typeof rawAnswer === "string" || typeof rawAnswer === "number") {
        return { valid: true, sanitized: String(rawAnswer).trim().toLowerCase() };
      }
      return { valid: false, sanitized: "", error: "Invalid true/false answer format" };
    }

    case "short_answer": {
      if (typeof rawAnswer !== "string") {
        return { valid: false, sanitized: "", error: "Short answer must be text" };
      }
      const trimmed = rawAnswer.trim();
      if (trimmed.length > 500) {
        return { valid: false, sanitized: "", error: "Answer exceeds maximum length" };
      }
      return { valid: true, sanitized: trimmed };
    }

    case "multiple_select": {
      if (!Array.isArray(rawAnswer)) {
        return { valid: false, sanitized: [], error: "Multiple select answer must be an array" };
      }
      const sanitized = rawAnswer.map((item) => String(item).trim()).filter(Boolean);
      return { valid: true, sanitized };
    }

    default:
      return { valid: true, sanitized: String(rawAnswer) };
  }
}

/**
 * Socket / Action Rate Limiter (Token bucket / sliding window)
 */
export function checkActionRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 10000
): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count++;
  return true;
}
