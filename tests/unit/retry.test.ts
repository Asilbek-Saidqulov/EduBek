/**
 * EduBek — Test: Retry with exponential backoff.
 *
 * Phase 4D.7 — Testing infrastructure.
 */
import { describe, it, expect } from "vitest";
import { withRetry } from "@/infra/retry";

describe("Retry with exponential backoff", () => {
  it("should return the result on first try if successful", async () => {
    const result = await withRetry(() => Promise.resolve("ok"), { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toBe("ok");
  });

  it("should retry on failure and eventually succeed", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("not yet");
        return "ok";
      },
      { maxAttempts: 5, baseDelayMs: 10, maxDelayMs: 50 },
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("should throw after max attempts", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("always fails");
        },
        { maxAttempts: 3, baseDelayMs: 10 },
      ),
    ).rejects.toThrow("always fails");
    expect(attempts).toBe(3);
  });

  it("should not retry if isRetriable returns false", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("not retriable");
        },
        { maxAttempts: 5, baseDelayMs: 10, isRetriable: () => false },
      ),
    ).rejects.toThrow("not retriable");
    expect(attempts).toBe(1);
  });
});
