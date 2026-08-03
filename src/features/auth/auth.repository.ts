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
      locale: input.locale ?? "uz",
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
