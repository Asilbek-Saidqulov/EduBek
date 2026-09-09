import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, peekRateLimit, type RateLimitResult } from "@/lib/rate-limiter";
import { getActivePlan } from "@/lib/plans";

/**
 * Fair-use limits.
 *
 * Unlimited (no quota here): published quizzes, class list, marketplace browse.
 * Soft AI caps: enough for a real study session, not a scrape bot.
 * Tight auth caps: stop password stuffing.
 */
export const USAGE_POLICIES = {
  loginBurst: { limit: 5, windowMs: 60 * 1000, label: "sign-in" },
  registerHour: { limit: 8, windowMs: 60 * 60 * 1000, label: "sign-up" },
  tutorBurst: { limit: 8, windowMs: 60 * 1000, label: "tutor" },
  tutorHour: { limit: 15, windowMs: 60 * 60 * 1000, label: "tutor" },
  tutorDay: { limit: 30, windowMs: 24 * 60 * 60 * 1000, label: "tutor today" },
  generateQuizHour: { limit: 6, windowMs: 60 * 60 * 1000, label: "quiz generation" },
  generateQuizDay: { limit: 12, windowMs: 24 * 60 * 60 * 1000, label: "quiz generation today" },
  generateQuizBurst: { limit: 3, windowMs: 60 * 1000, label: "quiz generation" },
  explainHour: { limit: 20, windowMs: 60 * 60 * 1000, label: "explanations" },
  explainDay: { limit: 40, windowMs: 24 * 60 * 60 * 1000, label: "explanations today" },
  classroomJoinHour: { limit: 15, windowMs: 60 * 60 * 1000, label: "class join" },
} as const;

export type UsagePolicyName = keyof typeof USAGE_POLICIES;

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export function usageSubject(req: NextRequest, userId?: string | null) {
  return userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
}

function limitFor(name: UsagePolicyName, userId?: string | null) {
  const base = USAGE_POLICIES[name].limit;
  if (name === "tutorHour") return getActivePlan().tutorHour;
  if (name === "tutorDay") return getActivePlan().tutorDay;
  if (name === "generateQuizHour") return getActivePlan().generateQuizHour;
  if (name === "generateQuizDay") return getActivePlan().generateQuizDay;
  if (name === "explainHour") return getActivePlan().explainHour;
  if (name === "explainDay") return getActivePlan().explainDay;
  return base;
}

export function enforcePolicy(
  name: UsagePolicyName,
  req: NextRequest,
  userId?: string | null,
): RateLimitResult {
  const policy = USAGE_POLICIES[name];
  const limit = limitFor(name, userId);
  const plan = getActivePlan();
  const key = `${name}:${plan.id}:${usageSubject(req, userId)}`;
  return checkRateLimit(key, limit, policy.windowMs);
}

export function rateLimitedJson(name: UsagePolicyName, result: RateLimitResult, userId?: string | null) {
  const policy = USAGE_POLICIES[name];
  const limit = limitFor(name, userId);
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: `Free plan cap reached for ${policy.label} (${limit} this window). Paid plans are listed on Wallet and stay disabled until payments are connected.`,
        retryAfterSeconds,
        remaining: result.remaining,
        limit,
        resetAt: result.resetAt.toISOString(),
        planId: getActivePlan().id,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

export function peekPolicy(
  name: UsagePolicyName,
  req: NextRequest,
  userId?: string | null,
): RateLimitResult {
  const policy = USAGE_POLICIES[name];
  const limit = limitFor(name, userId);
  const plan = getActivePlan();
  const key = `${name}:${plan.id}:${usageSubject(req, userId)}`;
  return peekRateLimit(key, limit);
}

export function consumeOrReject(
  name: UsagePolicyName,
  req: NextRequest,
  userId?: string | null,
) {
  const result = enforcePolicy(name, req, userId);
  if (!result.allowed) return { ok: false as const, response: rateLimitedJson(name, result, userId), result };
  return { ok: true as const, result };
}

export function consumeTutorTurn(req: NextRequest, userId?: string | null) {
  for (const name of ["tutorBurst", "tutorHour", "tutorDay"] as const) {
    const step = consumeOrReject(name, req, userId);
    if (!step.ok) return step;
  }
  return { ok: true as const };
}

export function consumeQuizGenerate(req: NextRequest, userId?: string | null) {
  for (const name of ["generateQuizBurst", "generateQuizHour", "generateQuizDay"] as const) {
    const step = consumeOrReject(name, req, userId);
    if (!step.ok) return step;
  }
  return { ok: true as const };
}
