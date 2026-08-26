import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";

describe("Rate Limiter Utility", () => {
  it("allows requests under the limit", () => {
    const key = `test-ip-${Date.now()}`;
    const result1 = checkRateLimit(key, 3, 1000);
    const result2 = checkRateLimit(key, 3, 1000);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });

  it("blocks requests that exceed the limit", () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, 2, 5000);
    checkRateLimit(key, 2, 5000);
    const result3 = checkRateLimit(key, 2, 5000);

    expect(result3.allowed).toBe(false);
    expect(result3.resetAt).toBeInstanceOf(Date);
  });
});
