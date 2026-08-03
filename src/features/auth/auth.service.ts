/**
 * EduBek — auth service.
 *
 * Business logic for register / login / refresh / logout. Routes are thin
 * wrappers around these functions; everything throw-able lives here.
 *
 * The service orchestrates:
 *   • the auth repository (persistence)
 *   • the password helpers (bcrypt)
 *   • the session token helpers (jose)
 *   • the refresh token helpers (node:crypto)
 *   • the event bus (publishes USER_REGISTERED / USER_LOGGED_IN / …)
 *
 * Cookie handling is intentionally NOT done here — the service returns a
 * `RegisterResult` / `AuthSessionDto` and lets the route handler decide
 * how to deliver the tokens (cookie, body, or both).
 */

import { env } from "@/config/env";
import { getLogger } from "@/lib/logger";
import { conflict, unauthorized } from "@/lib/errors";
import { eventBus } from "@/infra/event-bus";
import {
  USER_LOGGED_IN,
  USER_LOGGED_OUT,
  USER_REGISTERED,
} from "@/infra/event-bus/events";
import { PlatformRole } from "@/features/rbac/rbac.roles";
import {
  buildContext,
  type AuthContext,
  type PersonalPermissionOverride,
} from "@/features/rbac/rbac.service";
import { hashPassword, verifyPassword } from "@/features/auth/auth.password";
import { signSessionToken } from "@/features/auth/auth.session";
import {
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
} from "@/features/auth/auth.tokens";
import {
  assignPlatformRole,
  createSession,
  createUser,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  findUserPermissionOverrides,
  findUserPlatformRoles,
  findUserByUsername,
  revokeSession,
  updateUserLastLogin,
} from "@/features/auth/auth.repository";
import type { AuthSessionDto, UserDto } from "@/features/auth/auth.types";
import type { RegisterBody } from "@/features/auth/auth.schema";

const log = getLogger("auth");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toUserDto(
  user: NonNullable<Awaited<ReturnType<typeof findUserById>>>,
  roles: string[] = [],
): UserDto {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified
      ? user.emailVerified.toISOString()
      : null,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    country: user.country,
    locale: user.locale,
    isBanned: user.isBanned,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    platformRoles: roles,
  };
}

interface IssueSessionMeta {
  userAgent?: string;
  ipHash?: string;
  ipAddress?: string;
}

async function issueSession(
  user: NonNullable<Awaited<ReturnType<typeof findUserById>>>,
  roles: string[],
  meta?: IssueSessionMeta,
): Promise<AuthSessionDto> {
  const sessionToken = await signSessionToken({
    sub: user.id,
    email: user.email,
    roles,
    // Phase 4E.1: include user's preferred locale in the JWT
    locale: user.locale ?? undefined,
  });
  const { token: refreshToken, tokenHash } = generateRefreshToken();
  await createSession({
    userId: user.id,
    refreshTokenHash: tokenHash,
    userAgent: meta?.userAgent,
    ipHash: meta?.ipHash,
    expiresAt: refreshExpiryDate(),
  });

  return {
    sessionToken,
    refreshToken,
    sessionExpiresIn: env.auth.sessionTtlSeconds,
    refreshExpiresIn: env.auth.refreshTtlSeconds,
    user: toUserDto(user, roles),
  };
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export interface RegisterInput extends RegisterBody {
  userAgent?: string;
  ipAddress?: string;
}

export interface RegisterResult {
  session: AuthSessionDto;
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  if (input.username) {
    const existingUsername = await findUserByUsername(input.username);
    if (existingUsername) {
      throw conflict("This username is already taken");
    }
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
    username: input.username,
  });

  // Every new user gets the default `user` platform role. Creators are
  // upgraded to the `creator` role via a separate admin flow.
  await assignPlatformRole(user.id, PlatformRole.USER);

  const roles = [PlatformRole.USER];
  const session = await issueSession(user, roles, {
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  eventBus.publish({
    type: USER_REGISTERED,
    occurredAt: new Date(),
    actorId: user.id,
    userId: user.id,
    email: user.email,
    name: user.name ?? undefined,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  log.info("auth.registered", { userId: user.id, email: user.email });
  return { session };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function login(input: LoginInput): Promise<RegisterResult> {
  const user = await findUserByEmail(input.email);
  // Use the same error message for "no user" and "bad password" to avoid
  // leaking which one is wrong — a classic account-enumeration defense.
  if (!user) {
    throw unauthorized("Invalid email or password");
  }
  if (user.isBanned) {
    throw unauthorized("This account has been banned");
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw unauthorized("Invalid email or password");
  }

  await updateUserLastLogin(user.id);

  const roleRows = await findUserPlatformRoles(user.id);
  const roles = roleRows.map((r) => r.role);

  const session = await issueSession(user, roles, {
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  eventBus.publish({
    type: USER_LOGGED_IN,
    occurredAt: new Date(),
    actorId: user.id,
    userId: user.id,
    email: user.email,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  log.info("auth.logged_in", { userId: user.id });
  return { session };
}

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

export interface RefreshResult {
  session: AuthSessionDto;
}

export async function refreshSession(
  refreshToken: string | undefined,
): Promise<RefreshResult> {
  if (!refreshToken) {
    throw unauthorized("Missing refresh token");
  }
  const tokenHash = hashToken(refreshToken);
  const sessionRow = await findSessionByTokenHash(tokenHash);
  if (!sessionRow) {
    throw unauthorized("Invalid refresh token");
  }
  if (sessionRow.revokedAt) {
    throw unauthorized("Session has been revoked");
  }
  if (sessionRow.expiresAt < new Date()) {
    throw unauthorized("Session has expired");
  }

  const user = await findUserById(sessionRow.userId);
  if (!user || user.isBanned) {
    throw unauthorized("Account is not available");
  }

  const roleRows = await findUserPlatformRoles(user.id);
  const roles = roleRows.map((r) => r.role);

  // Rotate the refresh token: revoke the old one, issue a new one. This
  // limits the blast radius of a stolen token to its remaining lifetime.
  await revokeSession(tokenHash);
  const session = await issueSession(user, roles, {
    userAgent: sessionRow.userAgent ?? undefined,
  });

  log.info("auth.refreshed", { userId: user.id });
  return { session };
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(
  refreshToken: string | undefined,
  actorId?: string,
): Promise<void> {
  if (!refreshToken) {
    // Nothing to do — caller is already logged out.
    return;
  }
  const tokenHash = hashToken(refreshToken);
  await revokeSession(tokenHash);

  if (actorId) {
    eventBus.publish({
      type: USER_LOGGED_OUT,
      occurredAt: new Date(),
      actorId,
      userId: actorId,
    });
  }
  log.info("auth.logged_out", { userId: actorId });
}

// ---------------------------------------------------------------------------
// Current user + auth context
// ---------------------------------------------------------------------------

export async function getCurrentUser(userId: string): Promise<UserDto> {
  const user = await findUserById(userId);
  if (!user) {
    throw unauthorized("User not found");
  }
  const roleRows = await findUserPlatformRoles(user.id);
  return toUserDto(user, roleRows.map((r) => r.role));
}

/**
 * Build a fresh `AuthContext` for the given user. We always re-fetch the
 * roles + overrides from the DB so that revocations and role changes take
 * effect on the very next request — no caching at this layer.
 */
export async function buildAuthContext(
  userId: string,
  email: string,
  roles: string[],
): Promise<AuthContext> {
  const overrides = await findUserPermissionOverrides(userId);
  const personalOverrides: PersonalPermissionOverride[] = overrides.map(
    (o) => ({
      permission: o.permission,
      granted: o.granted,
      reason: o.reason ?? undefined,
    }),
  );
  return buildContext({
    userId,
    email,
    platformRoles: roles,
    personalPermissionOverrides: personalOverrides,
  });
}
