import { describe, it, expect, beforeEach } from 'vitest';
import { refreshSession } from '../auth.service';
import { registerUser } from '../auth.service';
import { db } from '@/lib/db';
import { hashToken } from '../auth.utils';

describe('Refresh Token Rotation', () => {
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

  it('should refresh with valid token', async () => {
    const result = await registerUser({
      email: 'test-refresh@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const refreshResult = await refreshSession(result.session.refreshToken);

    expect(refreshResult.session).toBeDefined();
    expect(refreshResult.session.user).toBeDefined();
    expect(refreshResult.session.sessionToken).toBeDefined();
    expect(refreshResult.session.refreshToken).toBeDefined();
    expect(refreshResult.session.sessionToken).not.toBe(result.session.sessionToken);
    expect(refreshResult.session.refreshToken).not.toBe(result.session.refreshToken);
  });

  it('should reject expired refresh token', async () => {
    const result = await registerUser({
      email: 'test-expired-refresh@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser2',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Manually expire the session
    await db.userSession.update({
      where: { id: result.session.sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      refreshSession(result.session.refreshToken)
    ).rejects.toThrow();
  });

  it('should reject revoked refresh token', async () => {
    const result = await registerUser({
      email: 'test-revoked-refresh@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser3',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Revoke the session
    await db.userSession.update({
      where: { id: result.session.sessionId },
      data: { revokedAt: new Date() },
    });

    await expect(
      refreshSession(result.session.refreshToken)
    ).rejects.toThrow();
  });

  it('should invalidate old refresh token after rotation', async () => {
    const result = await registerUser({
      email: 'test-rotation@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser4',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const oldRefreshToken = result.session.refreshToken;
    const oldRefreshTokenHash = hashToken(oldRefreshToken);

    await refreshSession(oldRefreshToken);

    // Old token should no longer work
    await expect(
      refreshSession(oldRefreshToken)
    ).rejects.toThrow();

    // Verify old token is revoked in database
    const session = await db.userSession.findFirst({
      where: { refreshTokenHash: oldRefreshTokenHash },
    });
    expect(session?.revokedAt).not.toBeNull();
  });

  it('should allow new refresh token to work', async () => {
    const result = await registerUser({
      email: 'test-new-refresh@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser5',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const refreshResult = await refreshSession(result.session.refreshToken);

    // New token should work
    const secondRefresh = await refreshSession(refreshResult.session.refreshToken);
    expect(secondRefresh.session).toBeDefined();
    expect(secondRefresh.session.refreshToken).not.toBe(refreshResult.session.refreshToken);
  });

  it('should update session timestamps', async () => {
    const result = await registerUser({
      email: 'test-timestamp@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser6',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const sessionBefore = await db.userSession.findUnique({
      where: { id: result.session.sessionId },
    });

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    await refreshSession(result.session.refreshToken);

    const sessionAfter = await db.userSession.findUnique({
      where: { id: result.session.sessionId },
    });

    expect(sessionAfter?.lastUsedAt).not.toEqual(sessionBefore?.lastUsedAt);
  });

  it('should handle concurrent refresh requests correctly', async () => {
    const result = await registerUser({
      email: 'test-concurrent@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser7',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Send concurrent refresh requests
    const [refresh1, refresh2] = await Promise.allSettled([
      refreshSession(result.session.refreshToken),
      refreshSession(result.session.refreshToken),
    ]);

    // At least one should succeed
    const successful = refresh1.status === 'fulfilled' || refresh2.status === 'fulfilled';
    expect(successful).toBe(true);

    // Both should not succeed with the same token (replay protection)
    const bothSucceeded = refresh1.status === 'fulfilled' && refresh2.status === 'fulfilled';
    expect(bothSucceeded).toBe(false);
  });
});
