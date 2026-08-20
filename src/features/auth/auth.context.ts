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

    const payload = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );

    return {
      userId: payload.userId || null,
      email: payload.email || null,
      platformRoles: payload.platformRoles || ["STUDENT"],
      isAuthenticated: !!payload.userId,
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
  if (!ctx.platformRoles.includes(role) && !ctx.platformRoles.includes("ADMIN") && !ctx.platformRoles.includes("SUPERADMIN")) {
    throw forbidden();
  }
}
