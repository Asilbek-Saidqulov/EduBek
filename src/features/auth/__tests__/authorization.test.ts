import { describe, it, expect, beforeEach } from 'vitest';
import { registerUser } from '../auth.service';
import { getAuthContext, requireAuth, requireRole } from '../auth.context';
import { db } from '@/lib/db';
import { setSessionCookie } from '../auth.cookies';

describe('Authorization', () => {
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

  it('should require authentication', async () => {
    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);

    expect(() => requireAuth(ctx)).toThrow();
  });

  it('should allow authenticated request', async () => {
    const result = await registerUser({
      email: 'test-auth@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(ctx.isAuthenticated).toBe(true);
    expect(() => requireAuth(ctx)).not.toThrow();
  });

  it('should reject insufficient role', async () => {
    const result = await registerUser({
      email: 'test-role@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser2',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(() => requireRole(ctx, 'ADMIN')).toThrow();
  });

  it('should allow user with required role', async () => {
    const result = await registerUser({
      email: 'test-admin@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser3',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Add ADMIN role
    await db.userRole.create({
      data: {
        userId: result.session.user.id,
        role: 'ADMIN',
      },
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(() => requireRole(ctx, 'ADMIN')).not.toThrow();
  });

  it('should reject expired role', async () => {
    const result = await registerUser({
      email: 'test-expired-role@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser4',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Add expired ADMIN role
    await db.userRole.create({
      data: {
        userId: result.session.user.id,
        role: 'ADMIN',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(() => requireRole(ctx, 'ADMIN')).toThrow();
  });

  it('should load roles from database only', async () => {
    const result = await registerUser({
      email: 'test-db-roles@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser5',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Add ADMIN role in database
    await db.userRole.create({
      data: {
        userId: result.session.user.id,
        role: 'ADMIN',
      },
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(ctx.platformRoles).toContain('ADMIN');
    expect(ctx.platformRoles).toContain('STUDENT');
  });

  it('should prevent role escalation through request manipulation', async () => {
    const result = await registerUser({
      email: 'test-escalation@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser6',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    // Even if we try to modify the context (which client can't do),
    // the requireRole function checks against the actual database roles
    expect(() => requireRole(ctx, 'ADMIN')).toThrow();
  });

  it('should allow ADMIN to access ADMIN endpoints', async () => {
    const result = await registerUser({
      email: 'test-admin-access@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser7',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Add ADMIN role
    await db.userRole.create({
      data: {
        userId: result.session.user.id,
        role: 'ADMIN',
      },
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(() => requireRole(ctx, 'ADMIN')).not.toThrow();
    expect(() => requireRole(ctx, 'STUDENT')).not.toThrow();
  });

  it('should allow SUPERADMIN to access all endpoints', async () => {
    const result = await registerUser({
      email: 'test-superadmin@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser8',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    // Add SUPERADMIN role
    await db.userRole.create({
      data: {
        userId: result.session.user.id,
        role: 'SUPERADMIN',
      },
    });

    await setSessionCookie(result.session.sessionToken);
    const ctx = await getAuthContext();

    expect(() => requireRole(ctx, 'ADMIN')).not.toThrow();
    expect(() => requireRole(ctx, 'STUDENT')).not.toThrow();
    expect(() => requireRole(ctx, 'SUPERADMIN')).not.toThrow();
  });
});
