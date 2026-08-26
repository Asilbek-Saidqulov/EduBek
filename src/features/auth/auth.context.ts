import { cookies } from "next/headers";
import { unauthorized, forbidden } from "@/lib/errors";

export interface AuthContext {
  userId: string | null;
  email: string | null;
  platformRoles: string[];
  isAuthenticated: boolean;
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("edubek_session");

    if (!sessionCookie?.value) {
      return {
        userId: null,
        email: null,
        platformRoles: [],
        isAuthenticated: false,
      };
    }

    let payload: any = null;
    try {
      const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
      payload = JSON.parse(decoded);
    } catch {
      payload = null;
    }

    if (!payload || !payload.userId) {
      return {
        userId: null,
        email: null,
        platformRoles: [],
        isAuthenticated: false,
      };
    }

    return {
      userId: payload.userId,
      email: payload.email || null,
      platformRoles: payload.platformRoles || ["STUDENT"],
      isAuthenticated: true,
    };
  } catch {
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
  const normalizedRole = role.toUpperCase();
  const hasRole =
    ctx.platformRoles.includes(normalizedRole) ||
    ctx.platformRoles.includes("ADMIN") ||
    ctx.platformRoles.includes("SUPERADMIN");

  if (!hasRole) {
    throw forbidden();
  }
}
