/**
 * EduBek — Target-user resolver.
 *
 * Many read endpoints accept a `?userId=` query parameter to look up
 * another user's data (e.g., a teacher viewing a student's progress, an
 * admin debugging a user's wallet). Without an explicit authorization
 * check, this becomes a horizontal IDOR: any authenticated user can pass
 * any other user's ID and read their data.
 *
 * This helper enforces the rule: only callers with the
 * `PlatformPermission.USERS_READ` permission (admin + moderator roles by
 * default) may target a user other than themselves. Regular users always
 * get their own data.
 *
 * Usage:
 *   const ctx = await getAuthContext();
 *   requireAuth(ctx);
 *   const targetUserId = resolveTargetUserId(ctx, searchParams.get('userId'));
 *   // ^ if a non-admin passes ?userId=other, this returns ctx.userId
 */
import { can, PlatformPermission, type AuthContext } from "@/features/rbac";

/**
 * Resolve the target user ID for a request. Returns the query-supplied
 * userId if the caller is authorized to read other users' data (admin or
 * moderator); otherwise returns the caller's own userId.
 *
 * Callers should still apply their OWN ownership / membership checks on
 * top of this — this helper only resolves WHICH user the request targets,
 * it does not authorize every operation.
 */
export function resolveTargetUserId(
  ctx: AuthContext,
  queryUserId: string | null | undefined,
): string | undefined {
  if (!ctx.userId) return undefined;
  // Admins / moderators can target any user.
  if (queryUserId && (can(ctx, PlatformPermission.USERS_READ) || ctx.isSuperadmin)) {
    return queryUserId;
  }
  // Regular users always target themselves — the query param is ignored.
  return ctx.userId;
}
