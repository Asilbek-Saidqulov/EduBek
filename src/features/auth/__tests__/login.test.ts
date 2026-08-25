import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginUser } from '../auth.service';
import { db } from '@/lib/db';
import { hashPassword } from '../auth.utils';

vi.mock('@/lib/db', () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userSession: {
        create: vi.fn(),
      },
    },
  };
});

describe('Login (Safe Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login with valid credentials', async () => {
    const password = 'SecurePassword123!';
    const passwordHash = await hashPassword(password);

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-login-1',
      email: 'test-login@example.com',
      name: 'Test User',
      username: 'testuser',
      passwordHash,
      isBanned: false,
      bannedUntil: null,
      avatarUrl: null,
      bio: null,
      country: 'UZ',
      roles: [{ role: 'STUDENT', expiresAt: null }],
    } as any);

    vi.mocked(db.userSession.create).mockResolvedValue({ id: 'sess-1' } as any);
    vi.mocked(db.user.update).mockResolvedValue({} as any);

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
    expect(result.session.user.platformRoles).toContain('STUDENT');
  });

  it('should reject wrong password with 401', async () => {
    const passwordHash = await hashPassword('CorrectPassword123!');

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-login-2',
      email: 'test-wrong@example.com',
      passwordHash,
      isBanned: false,
      bannedUntil: null,
      roles: [],
    } as any);

    await expect(
      loginUser({
        email: 'test-wrong@example.com',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow();
  });

  it('should reject nonexistent email', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    await expect(
      loginUser({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!',
      })
    ).rejects.toThrow();
  });

  it('should reject permanently banned user', async () => {
    const password = 'Password123!';
    const passwordHash = await hashPassword(password);

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-banned-1',
      email: 'banned@example.com',
      passwordHash,
      isBanned: true,
      bannedUntil: null,
      roles: [],
    } as any);

    await expect(
      loginUser({
        email: 'banned@example.com',
        password,
      })
    ).rejects.toThrow('Account is banned');
  });

  it('should allow login if temporary ban has expired', async () => {
    const password = 'Password123!';
    const passwordHash = await hashPassword(password);
    const expiredBanDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-tempban-1',
      email: 'tempban@example.com',
      name: 'Temp Ban User',
      username: 'tempban',
      passwordHash,
      isBanned: true,
      bannedUntil: expiredBanDate,
      avatarUrl: null,
      bio: null,
      country: 'UZ',
      roles: [{ role: 'STUDENT', expiresAt: null }],
    } as any);

    vi.mocked(db.userSession.create).mockResolvedValue({ id: 'sess-2' } as any);
    vi.mocked(db.user.update).mockResolvedValue({} as any);

    const result = await loginUser({
      email: 'tempban@example.com',
      password,
    });

    expect(result.session).toBeDefined();
    expect(result.session.user.email).toBe('tempban@example.com');
  });
});
