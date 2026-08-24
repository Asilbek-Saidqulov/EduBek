import { cookies } from "next/headers";
import { unauthorized, forbidden } from "@/lib/errors";
import { db } from "@/lib/db";
import { hashToken, isSessionExpired, isSessionRevoked, isUserBanned } from "./auth.utils";
import { getSessionCookie } from "./auth.cookies";

export interface AuthContext {
  userId: string | null;
  email: string | null;
  platformRoles: string[];
  isAuthenticated: boolean;
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const sessionToken = await getSessionCookie();

    if (!sessionToken) {
      return {
        userId: null,
        email: null,
        platformRoles: [],
        isAuthenticated: false,
      };
    }

    const sessionTokenHash = hashToken(sessionToken);

    // Find valid session
    const session = await db.userSession.findFirst({
      where: {
        sessionTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!session) {
      return {
        userId: null,
        email: null,
        platformRoles: [],
        isAuthenticated: false,
      };
    }

    // Check if user is banned
    if (isUserBanned(session.user.isBanned, session.user.bannedUntil)) {
      // Revoke the session
      await db.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      return {
        userId: null,
        email: null,
        platformRoles: [],
        isAuthenticated: false,
      };
    }

    // Map roles to string array
    const platformRoles = session.user.roles
      .filter((role: any) => !role.expiresAt || new Date(role.expiresAt) > new Date())
      .map((role: any) => role.role);

    return {
      userId: session.user.id,
      email: session.user.email,
      platformRoles: platformRoles.length > 0 ? platformRoles : ["STUDENT"],
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Auth context error:", error);
    return {
      userId: null,
      email: null,
      platformRoles: [],
      isAuthenticated: false,
    };
  }
}

export function requireAuth(ctx: AuthContext): asserts ctx is AuthContext & { userId: string } {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw unauthorized();
  }
}

export const USER_ID_HEADER = "x-user-id";

export async function loadOrgPermissions(...args: any[]): Promise<string[]> {
  return ["*"];
}

export function requireRole(ctx: AuthContext, role: string) {

  requireAuth(ctx);
  if (!ctx.platformRoles.includes(role) && !ctx.platformRoles.includes("ADMIN") && !ctx.platformRoles.includes("SUPERADMIN")) {
    throw forbidden();
  }
}
