import { type AuthContext } from "@/features/auth/auth.context";

export function resolveTargetUser(ctx: AuthContext, queryUserId?: string | null): string {
  if (queryUserId && queryUserId !== ctx.userId) {
    if (ctx.platformRoles.includes("ADMIN") || ctx.platformRoles.includes("SUPERADMIN")) {
      return queryUserId;
    }
  }
  return ctx.userId || "";
}

export const resolveTargetUserId = resolveTargetUser;

