import { describe, it, expect, beforeEach } from 'vitest';
import { getAuthContext } from '../auth.context';
import { registerUser } from '../auth.service';
import { db } from '@/lib/db';
import { hashToken } from '../auth.utils';
import { setSessionCookie, getSessionCookie } from '../auth.cookies';

describe('Session Validation', () => {
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

  it('should authenticate valid session', async () => {
    const result = await registerUser({
      email: 'test-session@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Simulate setting the session cookie
    await setSessionCookie(result.session.sessionToken);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.userId).toBe(result.session.user.id);
    expect(ctx.email).toBe('test-session@example.com');
  });

  it('should reject invalid token', async () => {
    // Set an invalid session token
    await setSessionCookie('invalid-token-1234567890abcdef');

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.userId).toBeNull();
  });

  it('should reject expired session', async () => {
    const result = await registerUser({
      email: 'test-expired@example.com',
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

    await setSessionCookie(result.session.sessionToken);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
  });

  it('should reject revoked session', async () => {
    const result = await registerUser({
      email: 'test-revoked@example.com',
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

    await setSessionCookie(result.session.sessionToken);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
  });

  it('should reject deleted user', async () => {
    const result = await registerUser({
      email: 'test-deleted@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser4',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await setSessionCookie(result.session.sessionToken);

    // Delete the user
    await db.user.delete({
      where: { id: result.session.user.id },
    });

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
  });

  it('should reject banned user', async () => {
    const result = await registerUser({
      email: 'test-banned@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser5',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Ban the user
    await db.user.update({
      where: { id: result.session.user.id },
      data: { isBanned: true, bannedUntil: null },
    });

    await setSessionCookie(result.session.sessionToken);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);

    // Session should be revoked
    const session = await db.userSession.findUnique({
      where: { id: result.session.sessionId },
    });
    expect(session?.revokedAt).not.toBeNull();
  });

  it('should exclude expired roles', async () => {
    const result = await registerUser({
      email: 'test-roles@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser6',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Add an expired role
    await db.userRole.create({
      data: {
        userId: result.session.user.id,
        role: 'ADMIN',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await setSessionCookie(result.session.sessionToken);

    const ctx = await getAuthContext();
    expect(ctx.platformRoles).not.toContain('ADMIN');
    expect(ctx.platformRoles).toContain('STUDENT');
  });

  it('should return anonymous when no cookie', async () => {
    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.userId).toBeNull();
    expect(ctx.email).toBeNull();
    expect(ctx.platformRoles).toEqual([]);
  });
});
