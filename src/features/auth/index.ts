/**
 * EduBek — auth barrel export.
 *
 * IMPORTANT: This barrel deliberately does NOT re-export `auth.tokens.ts`.
 * That module uses Node's `crypto` module, which is unavailable in the Edge
 * runtime. The Next.js middleware imports `verifySessionToken` directly
 * from `auth.session.ts` (Edge-safe), and if the barrel re-exported
 * `auth.tokens.ts`, the middleware's import graph would pull in Node-only
 * code transitively and fail to bundle.
 *
 * Callers that need refresh-token utilities (i.e. the auth service and the
 * refresh route) MUST import from `@/features/auth/auth.tokens` directly.
 */

export {
  type UserDto,
  type AuthSessionDto,
  type SessionTokenPayload,
} from "@/features/auth/auth.types";

export {
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
  emailSchema,
  passwordSchema,
  usernameSchema,
  type RegisterBody,
  type LoginBody,
  type RefreshBody,
} from "@/features/auth/auth.schema";

export {
  hashPassword,
  verifyPassword,
} from "@/features/auth/auth.password";

export {
  signSessionToken,
  verifySessionToken,
} from "@/features/auth/auth.session";

export {
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  sessionCookieOptions,
  refreshCookieOptions,
  clearCookieOptions,
  serializeCookie,
} from "@/features/auth/auth.cookies";

export {
  findUserByEmail,
  findUserById,
  findUserByUsername,
  createUser,
  updateUserLastLogin,
  findUserPlatformRoles,
  assignPlatformRole,
  findUserPermissionOverrides,
  createSession,
  findSessionByTokenHash,
  revokeSession,
  revokeAllUserSessions,
  touchSession,
} from "@/features/auth/auth.repository";

export {
  register,
  login,
  refreshSession,
  logout,
  getCurrentUser,
  buildAuthContext,
  type RegisterInput,
  type RegisterResult,
  type LoginInput,
  type RefreshResult,
} from "@/features/auth/auth.service";

export {
  getAuthContext,
  loadOrgPermissions,
  requireAuth,
  fetchPlatformRoles,
  USER_ID_HEADER,
  USER_EMAIL_HEADER,
  USER_ROLES_HEADER,
} from "@/features/auth/auth.context";
