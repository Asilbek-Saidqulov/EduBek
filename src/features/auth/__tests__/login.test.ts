import { describe, it, expect } from "vitest";
import { loginBodySchema } from "../auth.schema";

describe("Login Schema & Validation", () => {
  it("validates valid login credentials", () => {
    const payload = {
      email: "user@example.com",
      password: "SecretPassword123",
    };

    const parsed = loginBodySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email for login", () => {
    const payload = {
      email: "invalid-email",
      password: "SecretPassword123",
    };

    const parsed = loginBodySchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects short password (< 6 chars) for login", () => {
    const payload = {
      email: "user@example.com",
      password: "123",
    };

    const parsed = loginBodySchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
