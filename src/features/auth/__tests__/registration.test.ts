import { describe, it, expect } from "vitest";
import { registerBodySchema } from "../auth.schema";

describe("Registration Schema & Validation", () => {
  it("validates valid registration payload without username", () => {
    const payload = {
      name: "Alex Johnson",
      email: "alex@example.com",
      password: "Password123",
      locale: "uz",
    };

    const parsed = registerBodySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Alex Johnson");
      expect(parsed.data.email).toBe("alex@example.com");
      expect(parsed.data.locale).toBe("uz");
      expect(parsed.data.country).toBe("UZ");
    }
  });

  it("validates valid registration payload with custom username", () => {
    const payload = {
      name: "Alex Johnson",
      email: "alex@example.com",
      password: "Password123",
      username: "alex_j",
      locale: "en",
      country: "US",
    };

    const parsed = registerBodySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe("alex_j");
      expect(parsed.data.country).toBe("US");
    }
  });

  it("rejects invalid email address", () => {
    const payload = {
      name: "Alex Johnson",
      email: "not-an-email",
      password: "Password123",
    };

    const parsed = registerBodySchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects short password (< 6 chars)", () => {
    const payload = {
      name: "Alex Johnson",
      email: "alex@example.com",
      password: "123",
    };

    const parsed = registerBodySchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects short name (< 2 chars)", () => {
    const payload = {
      name: "A",
      email: "alex@example.com",
      password: "Password123",
    };

    const parsed = registerBodySchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
