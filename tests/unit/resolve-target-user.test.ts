/**
 * EduBek — Target-user resolver unit tests.
 *
 * Verifies the IDOR defense: regular users always target themselves,
 * only admins/moderators can target another user via ?userId=.
 */
import { describe, it, expect } from "vitest";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";
import { buildContext } from "@/features/rbac/rbac.service";

function regularUser() {
  return buildContext({ userId: "user-A", email: "a@test.local", platformRoles: ["user"] });
}
function adminUser() {
  return buildContext({ userId: "admin-1", email: "admin@test.local", platformRoles: ["admin"] });
}
function moderatorUser() {
  return buildContext({ userId: "mod-1", email: "mod@test.local", platformRoles: ["moderator"] });
}

describe("resolveTargetUserId — IDOR defense", () => {
  it("regular user with no query → targets themselves", () => {
    expect(resolveTargetUserId(regularUser(), null)).toBe("user-A");
    expect(resolveTargetUserId(regularUser(), undefined)).toBe("user-A");
  });

  it("regular user with ?userId=other → IGNORED, targets themselves", () => {
    expect(resolveTargetUserId(regularUser(), "user-B")).toBe("user-A");
  });

  it("admin with ?userId=other → targets other (authorized)", () => {
    expect(resolveTargetUserId(adminUser(), "user-B")).toBe("user-B");
  });

  it("moderator with ?userId=other → targets other (authorized)", () => {
    expect(resolveTargetUserId(moderatorUser(), "user-B")).toBe("user-B");
  });

  it("admin with no query → targets themselves", () => {
    expect(resolveTargetUserId(adminUser(), null)).toBe("admin-1");
  });

  it("anonymous context → returns undefined", () => {
    const ctx = buildContext({ platformRoles: [] });
    expect(resolveTargetUserId(ctx, "user-B")).toBeUndefined();
  });
});
