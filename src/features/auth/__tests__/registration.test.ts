import { describe, it, expect, beforeEach } from 'vitest';
import { registerUser } from '../auth.service';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '../auth.utils';

describe('Registration', () => {
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

  it('should successfully register a valid user', async () => {
    const result = await registerUser({
      email: 'test-user@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser',
      locale: 'en',
      country: 'US',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });

    expect(result.session).toBeDefined();
    expect(result.session.user).toBeDefined();
    expect(result.session.user.email).toBe('test-user@example.com');
    expect(result.session.user.name).toBe('Test User');
    expect(result.session.user.username).toBe('testuser');
    expect(result.session.user.platformRoles).toContain('STUDENT');
    expect(result.session.sessionToken).toBeDefined();
    expect(result.session.refreshToken).toBeDefined();
    expect(result.session.expiresAt).toBeInstanceOf(Date);
  });

  it('should reject duplicate email', async () => {
    const userData = {
      email: 'test-duplicate@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser1',
      locale: 'en' as const,
      country: 'US',
    };

    await registerUser({ ...userData, userAgent: 'test', ipAddress: '127.0.0.1' });

    await expect(
      registerUser({ ...userData, username: 'testuser2', userAgent: 'test', ipAddress: '127.0.0.1' })
    ).rejects.toThrow();
  });

  it('should reject duplicate username', async () => {
    const userData = {
      email: 'test-user1@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser',
      locale: 'en' as const,
      country: 'US',
    };

    await registerUser({ ...userData, userAgent: 'test', ipAddress: '127.0.0.1' });

    await expect(
      registerUser({ ...userData, email: 'test-user2@example.com', userAgent: 'test', ipAddress: '127.0.0.1' })
    ).rejects.toThrow();
  });

  it('should hash password with bcrypt', async () => {
    await registerUser({
      email: 'test-password@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser3',
      locale: 'en' as const,
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const user = await db.user.findUnique({
      where: { email: 'test-password@example.com' },
    });

    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe('SecurePassword123!');
    expect(user?.passwordHash).not.toBe('hashed_dummy');
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  it('should verify password correctly', async () => {
    const password = 'SecurePassword123!';
    await registerUser({
      email: 'test-verify@example.com',
      password,
      name: 'Test User',
      username: 'testuser4',
      locale: 'en' as const,
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const user = await db.user.findUnique({
      where: { email: 'test-verify@example.com' },
    });

    const isValid = await verifyPassword(password, user!.passwordHash!);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', user!.passwordHash!);
    expect(isInvalid).toBe(false);
  });

  it('should not return passwordHash in response', async () => {
    const result = await registerUser({
      email: 'test-nohash@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser5',
      locale: 'en' as const,
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    expect(result.session.user.passwordHash).toBeUndefined();
  });

  it('should create default STUDENT role', async () => {
    await registerUser({
      email: 'test-role@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser6',
      locale: 'en' as const,
      country: 'US',
      userAgent: 'test',
      ipAddress: '127.0.0.1',
    });

    const user = await db.user.findUnique({
      where: { email: 'test-role@example.com' },
      include: { roles: true },
    });

    expect(user?.roles).toHaveLength(1);
    expect(user?.roles[0].role).toBe('STUDENT');
  });

  it('should create session in database', async () => {
    const result = await registerUser({
      email: 'test-session@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      username: 'testuser7',
      locale: 'en' as const,
      country: 'US',
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
});
