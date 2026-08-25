import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser } from '../auth.service';
import { db } from '@/lib/db';
import { verifyPassword } from '../auth.utils';

vi.mock('@/lib/db', () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userRole: {
        create: vi.fn(),
      },
      userSession: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('Registration (Safe Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully register a valid user without username (auto-generated username)', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    let createdUserData: any = null;

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        user: {
          create: vi.fn().mockImplementation(({ data }) => {
            createdUserData = data;
            return Promise.resolve({
              id: 'user-id-1',
              email: data.email,
              name: data.name,
              username: data.username,
              avatarUrl: null,
              bio: null,
              country: data.country,
            });
          }),
          update: vi.fn().mockImplementation(() => {
            return Promise.resolve({
              id: 'user-id-1',
              email: createdUserData.email,
              name: createdUserData.name,
              username: createdUserData.username,
              avatarUrl: null,
              bio: null,
              country: createdUserData.country,
            });
          }),
        },
        userRole: {
          create: vi.fn().mockResolvedValue({ id: 'role-1', role: 'STUDENT' }),
        },
        userSession: {
          create: vi.fn().mockResolvedValue({ id: 'session-1' }),
        },
      };
      return callback(tx);
    });

    const result = await registerUser({
      email: 'test-user@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
      locale: 'en',
      country: 'US',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });

    expect(result.session).toBeDefined();
    expect(result.session.user).toBeDefined();
    expect(result.session.user.email).toBe('test-user@example.com');
    expect(result.session.user.name).toBe('Test User');
    expect(result.session.user.username).toMatch(/^[a-z0-9_]{3,30}$/);
    expect(result.session.user.platformRoles).toContain('STUDENT');
    expect(result.session.sessionToken).toBeDefined();
    expect(result.session.refreshToken).toBeDefined();
    expect(result.session.expiresAt).toBeInstanceOf(Date);

    // Password must be hashed with bcrypt
    expect(createdUserData.passwordHash).toBeDefined();
    const isPwValid = await verifyPassword('SecurePassword123!', createdUserData.passwordHash);
    expect(isPwValid).toBe(true);
  });

  it('should successfully register with an explicitly provided username', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        user: {
          create: vi.fn().mockImplementation(({ data }) => Promise.resolve({
            id: 'user-id-2',
            email: data.email,
            name: data.name,
            username: data.username,
            avatarUrl: null,
            bio: null,
            country: data.country,
          })),
          update: vi.fn().mockResolvedValue({
            id: 'user-id-2',
            email: 'custom@example.com',
            name: 'Custom User',
            username: 'custom_handle',
            avatarUrl: null,
            bio: null,
            country: 'UZ',
          }),
        },
        userRole: {
          create: vi.fn().mockResolvedValue({ id: 'role-2', role: 'STUDENT' }),
        },
        userSession: {
          create: vi.fn().mockResolvedValue({ id: 'session-2' }),
        },
      };
      return callback(tx);
    });

    const result = await registerUser({
      email: 'custom@example.com',
      password: 'SecurePassword123!',
      name: 'Custom User',
      username: 'custom_handle',
      locale: 'uz',
    });

    expect(result.session.user.username).toBe('custom_handle');
  });

  it('should reject duplicate email with 409 CONFLICT', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'existing-id',
      email: 'duplicate@example.com',
    } as any);

    await expect(
      registerUser({
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        name: 'Duplicate User',
      })
    ).rejects.toThrow('User with this email already exists');
  });

  it('should reject duplicate username with 409 CONFLICT', async () => {
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ id: 'existing-id', username: 'taken_name' } as any); // username check

    await expect(
      registerUser({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        username: 'taken_name',
      })
    ).rejects.toThrow('Username already taken');
  });

  it('should never expose passwordHash in returned safeUser', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'user-id-3',
            email: 'nohash@example.com',
            name: 'No Hash',
            username: 'nohash_user',
            avatarUrl: null,
            bio: null,
            country: 'UZ',
          }),
          update: vi.fn().mockResolvedValue({
            id: 'user-id-3',
            email: 'nohash@example.com',
            name: 'No Hash',
            username: 'nohash_user',
            avatarUrl: null,
            bio: null,
            country: 'UZ',
          }),
        },
        userRole: {
          create: vi.fn().mockResolvedValue({ id: 'role-3', role: 'STUDENT' }),
        },
        userSession: {
          create: vi.fn().mockResolvedValue({ id: 'session-3' }),
        },
      };
      return callback(tx);
    });

    const result = await registerUser({
      email: 'nohash@example.com',
      password: 'SecurePassword123!',
      name: 'No Hash',
    });

    expect((result.session.user as any).passwordHash).toBeUndefined();
  });
});
