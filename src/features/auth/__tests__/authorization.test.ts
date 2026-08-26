import { describe, it, expect } from "vitest";
import { requireAuth, requireRole, type AuthContext } from "../auth.context";

describe("Authorization Context & Role Guards", () => {
  it("allows authenticated user to pass requireAuth", () => {
    const ctx: AuthContext = {
      userId: "user-123",
      email: "test@example.com",
      platformRoles: ["STUDENT"],
      isAuthenticated: true,
    };

    expect(() => requireAuth(ctx)).not.toThrow();
  });

  it("throws unauthorized error for unauthenticated context in requireAuth", () => {
    const ctx: AuthContext = {
      userId: null,
      email: null,
      platformRoles: [],
      isAuthenticated: false,
    };

    expect(() => requireAuth(ctx)).toThrow();
  });

  it("allows user with matching role in requireRole", () => {
    const ctx: AuthContext = {
      userId: "user-123",
      email: "test@example.com",
      platformRoles: ["TEACHER", "STUDENT"],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, "TEACHER")).not.toThrow();
    expect(() => requireRole(ctx, "teacher")).not.toThrow();
  });

  it("allows admin to pass any role check", () => {
    const ctx: AuthContext = {
      userId: "admin-123",
      email: "admin@example.com",
      platformRoles: ["ADMIN"],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, "CREATOR")).not.toThrow();
    expect(() => requireRole(ctx, "TEACHER")).not.toThrow();
  });

  it("throws forbidden error if user lacks required role", () => {
    const ctx: AuthContext = {
      userId: "user-123",
      email: "student@example.com",
      platformRoles: ["STUDENT"],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, "ADMIN")).toThrow();
  });
});
