/**
 * EduBek — Test: Circuit breaker.
 *
 * Phase 4D.7 — Testing infrastructure.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createCircuitBreaker } from "@/infra/circuit-breaker";

describe("Circuit breaker", () => {
  it("should pass through when the operation succeeds", async () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 100, halfOpenMaxAttempts: 1, name: "test-success" });
    const result = await breaker.execute(() => Promise.resolve(42));
    expect(result).toBe(42);
    expect(breaker.getState().state).toBe("closed");
  });

  it("should open after threshold failures", async () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 10_000, halfOpenMaxAttempts: 1, name: "test-open" });
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    }
    expect(breaker.getState().state).toBe("open");
    // Now it should fail fast without calling the function
    await expect(breaker.execute(() => Promise.resolve(42))).rejects.toThrow("is open");
  });

  it("should reset failure count on success", async () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 10_000, halfOpenMaxAttempts: 1, name: "test-reset" });
    // Two failures
    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    expect(breaker.getState().failureCount).toBe(2);
    // One success
    await breaker.execute(() => Promise.resolve(42));
    expect(breaker.getState().failureCount).toBe(0);
    expect(breaker.getState().state).toBe("closed");
  });
});
