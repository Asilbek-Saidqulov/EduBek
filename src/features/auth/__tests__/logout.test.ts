import { describe, it, expect, beforeEach } from 'vitest';
import { logout } from '../auth.service';
import { registerUser } from '../auth.service';
import { db } from '@/lib/db';
import { hashToken } from '../auth.utils';

describe('Logout', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.userSession.deleteMany({});
    await db.userRole.deleteMany({});
    await db.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });
  });

  it('should logout valid session', async () => {
    const result = await registerUser({
      email: 'test-logout@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await logout(result.session.refreshToken, result.session.user.id);

    const session = await db.userSession.findUnique({
      where: { id: result.session.sessionId },
    });

    expect(session?.revokedAt).not.toBeNull();
  });

  it('should handle already revoked session', async () => {
    const result = await registerUser({
      email: 'test-already-revoked@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser2',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Revoke the session first
    await db.userSession.update({
      where: { id: result.session.sessionId },
      data: { revokedAt: new Date() },
    });

    // Logout should still succeed (best-effort)
    await expect(
      logout(result.session.refreshToken, result.session.user.id)
    ).resolves.not.toThrow();
  });

  it('should handle invalid refresh token', async () => {
    // Logout should succeed even with invalid token (best-effort)
    await expect(
      logout('invalid-token-1234567890abcdef', undefined)
    ).resolves.not.toThrow();
  });

  it('should handle missing refresh token', async () => {
    // Logout should succeed even with missing token (best-effort)
    await expect(
      logout(undefined, undefined)
    ).resolves.not.toThrow();
  });

  it('should revoke all user sessions when userId provided', async () => {
    const result = await registerUser({
      email: 'test-all-sessions@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser3',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Create another session for the same user
    await registerUser({
      email: 'test-all-sessions@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser3',
      locale: 'en',
      country: 'US',
      userAgent: 'test2',
      ipAddress: '127.0.0.2',
    });

    // Logout with userId should revoke all sessions
    await logout(undefined, result.session.user.id);

    const sessions = await db.userSession.findMany({
      where: { userId: result.session.user.id },
    });

    expect(sessions).toHaveLength(2);
    expect(sessions.every(s => s.revokedAt !== null)).toBe(true);
  });

  it('should not affect other users sessions', async () => {
    const user1 = await registerUser({
      email: 'test-user1@example.com',
      password: 'SecurePassword123!',
      name: 'Test User 1',
      username: 'testuser4',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const user2 = await registerUser({
      email: 'test-user2@example.com',
      password: 'SecurePassword123!',
      name: 'Test User 2',
      username: 'testuser5',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Logout user1
    await logout(user1.session.refreshToken, user1.session.user.id);

    // User2 session should still be valid
    const user2Session = await db.userSession.findUnique({
      where: { id: user2.session.sessionId },
    });

    expect(user2Session?.revokedAt).toBeNull();
  });
});
