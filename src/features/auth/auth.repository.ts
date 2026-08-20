/**
 * EduBek — auth repository.
 *
 * The ONLY layer that talks to Prisma for the auth feature. Services call
 * these helpers; they never touch `db` directly. Keeping the surface small
 * makes it trivial to swap the persistence layer (e.g. for tests, or for a
 * read-replica setup) without touching business logic.
 */

import { db } from "@/lib/db";
import type { User, UserPermission, UserRole, UserSession } from "@prisma/client";
import { defaultLocale } from "@/i18n/routing";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

export async function findUserByUsername(
  username: string,
): Promise<User | null> {
  return db.user.findUnique({ where: { username } });
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
  username?: string;
  locale?: string;
}

export async function createUser(
  input: CreateUserInput,
): Promise<User> {
  return db.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      name: input.name ?? null,
      username: input.username ?? null,
      // Fall back to the platform's default locale (kept in sync with
      // `src/i18n/routing.ts`), not a hardcoded language — previously
      // this always wrote "uz" even for a user registering from the
      // English or Russian site, silently overriding their locale.
      locale: input.locale ?? defaultLocale,
    },
  });
}

export async function updateUserLastLogin(
  userId: string,
  ipHash?: string,
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIpHash: ipHash ?? null,
    },
  });
}

/**
 * Patch the user's editable profile fields. Only non-undefined fields are
 * written; `null` clears nullable fields (e.g. bio, avatarUrl). The
 * `email`, `passwordHash`, `isBanned`, `emailVerified` fields are
 * intentionally NOT exposed here — those go through dedicated flows
 * (email change, password change, admin ban).
 */
export interface UpdateUserInput {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
}

export async function updateUser(
  userId: string,
  patch: UpdateUserInput,
): Promise<User> {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.username !== undefined) data.username = patch.username;
  if (patch.avatarUrl !== undefined) data.avatarUrl = patch.avatarUrl;
  if (patch.bio !== undefined) data.bio = patch.bio;
  if (patch.country !== undefined) data.country = patch.country;
  return db.user.update({ where: { id: userId }, data });
}

// ---------------------------------------------------------------------------
// Platform roles + permission overrides
// ---------------------------------------------------------------------------

export async function findUserPlatformRoles(
  userId: string,
): Promise<UserRole[]> {
  return db.userRole.findMany({ where: { userId } });
}

export async function assignPlatformRole(
  userId: string,
  role: string,
  grantedBy?: string,
): Promise<UserRole> {
  return db.userRole.create({
    data: { userId, role, grantedBy: grantedBy ?? null },
  });
}

export async function findUserPermissionOverrides(
  userId: string,
): Promise<UserPermission[]> {
  return db.userPermission.findMany({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Sessions (refresh tokens)
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  deviceId?: string;
  userAgent?: string;
  ipHash?: string;
  expiresAt: Date;
}

export async function createSession(
  input: CreateSessionInput,
): Promise<UserSession> {
  return db.userSession.create({
    data: {
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      deviceId: input.deviceId ?? null,
      userAgent: input.userAgent ?? null,
      ipHash: input.ipHash ?? null,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findSessionByTokenHash(
  tokenHash: string,
): Promise<UserSession | null> {
  return db.userSession.findUnique({
    where: { refreshTokenHash: tokenHash },
  });
}

export async function revokeSession(tokenHash: string): Promise<void> {
  await db.userSession.updateMany({
    where: { refreshTokenHash: tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function touchSession(
  tokenHash: string,
  newExpiresAt: Date,
): Promise<void> {
  await db.userSession.update({
    where: { refreshTokenHash: tokenHash },
    data: { lastUsedAt: new Date(), expiresAt: newExpiresAt },
  });
}
