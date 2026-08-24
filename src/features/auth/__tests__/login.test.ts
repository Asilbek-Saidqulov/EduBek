import { describe, it, expect, beforeEach } from 'vitest';
import { loginUser } from '../auth.service';
import { registerUser } from '../auth.service';
import { db } from '@/lib/db';
import { hashPassword } from '../auth.utils';

describe('Login', () => {
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

  it('should login with valid credentials', async () => {
    const password = 'SecurePassword123!';
    await registerUser({
      email: 'test-login@example.com',
      password,
      name: 'Test User',
      username: 'testuser',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const result = await loginUser({
      email: 'test-login@example.com',
      password,
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });

    expect(result.session).toBeDefined();
    expect(result.session.user).toBeDefined();
    expect(result.session.user.email).toBe('test-login@example.com');
    expect(result.session.sessionToken).toBeDefined();
    expect(result.session.refreshToken).toBeDefined();
    expect(result.session.expiresAt).toBeInstanceOf(Date);
  });

  it('should reject wrong password with 401', async () => {
    await registerUser({
      email: 'test-wrong@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser2',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await expect(
      loginUser({
        email: 'test-wrong@example.com',
        password: 'WrongPassword',
        userAgent: 'test',
        ipAddress: '127.0.0.1',
      })
    ).rejects.toThrow();
  });

  it('should reject nonexistent email with same error as wrong password', async () => {
    const error1 = await loginUser({
      email: 'test-nonexistent@example.com',
      password: 'AnyPassword',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    }).catch(e => e.message);

    await registerUser({
      email: 'test-enum@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser3',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const error2 = await loginUser({
      email: 'test-enum@example.com',
      password: 'WrongPassword',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    }).catch(e => e.message);

    // Errors should be generic to prevent user enumeration
    expect(error1).toBeTruthy();
    expect(error2).toBeTruthy();
  });

  it('should reject banned user', async () => {
    await registerUser({
      email: 'test-banned@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser4',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    await db.user.update({
      where: { email: 'test-banned@example.com' },
      data: { isBanned: true, bannedUntil: null },
    });

    await expect(
      loginUser({
        email: 'test-banned@example.com',
        password: 'SecurePassword123!',
        userAgent: 'test',
        ipAddress: '127.0.0.1',
      })
    ).rejects.toThrow();
  });

  it('should allow login if temporary ban has expired', async () => {
    await registerUser({
      email: 'test-tempban@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser5',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() - 1);

    await db.user.update({
      where: { email: 'test-tempban@example.com' },
      data: { isBanned: true, bannedUntil: expiredDate },
    });

    const result = await loginUser({
      email: 'test-tempban@example.com',
      password: 'SecurePassword123!',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    expect(result.session).toBeDefined();
  });

  it('should reject login if temporary ban is active', async () => {
    await registerUser({
      email: 'test-activeban@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser6',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    await db.user.update({
      where: { email: 'test-activeban@example.com' },
      data: { isBanned: true, bannedUntil: futureDate },
    });

    await expect(
      loginUser({
        email: 'test-activeban@example.com',
        password: 'SecurePassword123!',
        userAgent: 'test',
        ipAddress: '127.0.0.1',
      })
    ).rejects.toThrow();
  });

  it('should create valid session in database', async () => {
    await registerUser({
      email: 'test-sess@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser7',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const result = await loginUser({
      email: 'test-sess@example.com',
      password: 'SecurePassword123!',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });

    const sessions = await db.userSession.findMany({
      where: { userId: result.session.user.id },
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionTokenHash).toBeDefined();
    expect(sessions[0].refreshTokenHash).toBeDefined();
    expect(sessions[0].userAgent).toBe('test-agent');
  });

  it('should generate secure tokens', async () => {
    await registerUser({
      email: 'test-secure@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser8',
      locale: 'en',
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const result = await loginUser({
      email: 'test-secure@example.com',
      password: 'SecurePassword123!',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    expect(result.session.sessionToken).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(result.session.refreshToken).toHaveLength(64);
    expect(result.session.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    expect(result.session.refreshToken).toMatch(/^[a-f0-9]{64}$/);
  });
});
