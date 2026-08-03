/**
 * EduBek — Test: Rate limiter.
 *
 * Phase 4D.7 — Testing infrastructure.
 *
 * Run: npx vitest run tests/unit/rate-limiter.test.ts
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createRateLimiter } from "@/infra/rate-limiter";

describe("Rate limiter", () => {
  it("should allow requests within the limit", () => {
    const limiter = createRateLimiter({ windowMs: 1_000, max: 3, prefix: "test-allow" });
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
  });

  it("should block requests that exceed the limit", () => {
    const limiter = createRateLimiter({ windowMs: 1_000, max: 2, prefix: "test-block" });
    limiter.check("user2"); // 1
    limiter.check("user2"); // 2
    const result = limiter.check("user2"); // 3 — should be blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("should track different identifiers independently", () => {
    const limiter = createRateLimiter({ windowMs: 1_000, max: 1, prefix: "test-independent" });
    expect(limiter.check("user-a").allowed).toBe(true);
    expect(limiter.check("user-b").allowed).toBe(true);
    expect(limiter.check("user-a").allowed).toBe(false);
    expect(limiter.check("user-b").allowed).toBe(false);
  });

  it("should reset the counter after calling reset()", () => {
    const limiter = createRateLimiter({ windowMs: 1_000, max: 1, prefix: "test-reset" });
    limiter.check("user3");
    expect(limiter.check("user3").allowed).toBe(false);
    limiter.reset("user3");
    expect(limiter.check("user3").allowed).toBe(true);
  });
});
