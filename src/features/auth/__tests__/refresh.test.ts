import { describe, it, expect } from "vitest";
import { refreshBodySchema } from "../auth.schema";
import { refreshCookieOptions } from "../auth.cookies";

describe("Refresh Schema & Cookie Settings", () => {
  it("parses empty or valid refresh body", () => {
    expect(refreshBodySchema.safeParse({}).success).toBe(true);
    expect(
      refreshBodySchema.safeParse({ refreshToken: "token_12345" }).success
    ).toBe(true);
  });

  it("sets appropriate maxAge for refresh cookie (30 days)", () => {
    const opts = refreshCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(60 * 60 * 24 * 30);
  });
});
