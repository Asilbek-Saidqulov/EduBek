import { describe, it, expect } from "vitest";
import { buildSessionTokens } from "../auth.service";

describe("Session Token Building", () => {
  it("creates valid base64 sessionToken and sha256 hashes", () => {
    const user = {
      id: "usr-456",
      email: "student@edubek.local",
      roles: ["STUDENT"],
    };

    const tokens = buildSessionTokens(user);

    expect(tokens.sessionToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.sessionTokenHash).toHaveLength(64); // SHA-256 hex string
    expect(tokens.refreshTokenHash).toHaveLength(64);
    expect(tokens.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Decode session payload
    const decoded = JSON.parse(
      Buffer.from(tokens.sessionToken, "base64").toString("utf-8")
    );
    expect(decoded.userId).toBe("usr-456");
    expect(decoded.email).toBe("student@edubek.local");
    expect(decoded.platformRoles).toEqual(["STUDENT"]);
  });
});
