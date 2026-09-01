import { cookies } from "next/headers";
import { unauthorized, forbidden } from "@/lib/errors";
import { verifySessionToken } from "@/lib/session-token";
import { db } from "@/lib/db";

export interface AuthContext {
  userId: string | null;
  email: string | null;
  platformRoles: string[];
  isAuthenticated: boolean;
  orgIds?: string[];
  orgPermissions?: string[];
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("edubek_session");

    if (!sessionCookie?.value) {
      return { userId: null, email: null, platformRoles: [], isAuthenticated: false };
    }

    const payload = verifySessionToken(sessionCookie.value);
    if (!payload?.userId) {
      return { userId: null, email: null, platformRoles: [], isAuthenticated: false };
    }

    return {
      userId: payload.userId,
      email: payload.email || null,
      platformRoles: payload.platformRoles || ["STUDENT"],
      isAuthenticated: true,
    };
  } catch {
    return { userId: null, email: null, platformRoles: [], isAuthenticated: false };
  }
}

export function requireAuth(ctx: AuthContext): asserts ctx is AuthContext & { userId: string } {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw unauthorized();
  }
}

export const USER_ID_HEADER = "x-user-id";

export async function loadOrgPermissions(ctx: AuthContext): Promise<string[]> {
  if (!ctx.userId) {
    ctx.orgPermissions = [];
    return [];
  }
  try {
    const memberships = await (db as any).organizationMembership.findMany({
      where: { userId: ctx.userId, status: "active" },
      include: { org: { select: { id: true } } },
    });
    ctx.orgIds = memberships.map((m: any) => m.orgId);
    ctx.orgPermissions = memberships.length ? ["org.member"] : [];
    return ctx.orgPermissions;
  } catch {
    ctx.orgPermissions = [];
    return [];
  }
}

export function requireRole(ctx: AuthContext, role: string) {
  requireAuth(ctx);
  const normalizedRole = role.toUpperCase();
  const hasRole =
    ctx.platformRoles.includes(normalizedRole) ||
    ctx.platformRoles.includes("ADMIN") ||
    ctx.platformRoles.includes("SUPERADMIN");
  if (!hasRole) throw forbidden();
}
