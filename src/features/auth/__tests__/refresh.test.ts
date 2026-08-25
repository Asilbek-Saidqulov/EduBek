import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshSession } from '../auth.service';
import { db } from '@/lib/db';
import { hashToken } from '../auth.utils';

vi.mock('@/lib/db', () => {
  return {
    db: {
      userSession: {
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };
});

describe('Refresh Session Rotation (Safe Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh valid session and perform atomic rotation', async () => {
    const rawRefreshToken = 'test-refresh-token-valid';
    const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    vi.mocked(db.userSession.findFirst).mockResolvedValue({
      id: 'session-id-1',
      userId: 'user-id-1',
      refreshTokenHash: hashToken(rawRefreshToken),
      revokedAt: null,
      expiresAt: futureDate,
      user: {
        id: 'user-id-1',
        email: 'refresh-test@example.com',
        name: 'Refresh Test',
        username: 'refreshtest',
        avatarUrl: null,
        bio: null,
        country: 'UZ',
        isBanned: false,
        bannedUntil: null,
        roles: [{ role: 'STUDENT', expiresAt: null }],
      },
    } as any);

    vi.mocked(db.userSession.updateMany).mockResolvedValue({ count: 1 });

    const result = await refreshSession(rawRefreshToken);

    expect(result.session).toBeDefined();
    expect(result.session.user).toBeDefined();
    expect(result.session.user.email).toBe('refresh-test@example.com');
    expect(result.session.sessionToken).toBeDefined();
    expect(result.session.refreshToken).toBeDefined();
    expect(result.session.refreshToken).not.toBe(rawRefreshToken);
    expect(result.session.expiresAt).toBeInstanceOf(Date);

    // Verify atomic CAS update was called once with count 1
    expect(db.userSession.updateMany).toHaveBeenCalledTimes(1);
  });

  it('should reject non-existent or invalid refresh token', async () => {
    vi.mocked(db.userSession.findFirst).mockResolvedValue(null);

    await expect(
      refreshSession('invalid-refresh-token')
    ).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should reject refresh if user is banned and revoke session', async () => {
    const rawRefreshToken = 'banned-user-refresh-token';
    const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    vi.mocked(db.userSession.findFirst).mockResolvedValue({
      id: 'session-banned',
      userId: 'banned-user',
      refreshTokenHash: hashToken(rawRefreshToken),
      revokedAt: null,
      expiresAt: futureDate,
      user: {
        id: 'banned-user',
        isBanned: true,
        bannedUntil: null,
        roles: [],
      },
    } as any);

    vi.mocked(db.userSession.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      refreshSession(rawRefreshToken)
    ).rejects.toThrow('Invalid or expired refresh token');

    // Should revoke session
    expect(db.userSession.updateMany).toHaveBeenCalled();
  });

  it('should reject refresh if concurrent CAS rotation count is 0', async () => {
    const rawRefreshToken = 'racing-token';
    const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    vi.mocked(db.userSession.findFirst).mockResolvedValue({
      id: 'session-racing',
      userId: 'race-user',
      refreshTokenHash: hashToken(rawRefreshToken),
      revokedAt: null,
      expiresAt: futureDate,
      user: {
        id: 'race-user',
        email: 'race@example.com',
        name: 'Race User',
        username: 'raceuser',
        avatarUrl: null,
        bio: null,
        country: 'UZ',
        isBanned: false,
        bannedUntil: null,
        roles: [{ role: 'STUDENT', expiresAt: null }],
      },
    } as any);

    // Another concurrent request already updated the token -> count 0
    vi.mocked(db.userSession.updateMany).mockResolvedValue({ count: 0 });

    await expect(
      refreshSession(rawRefreshToken)
    ).rejects.toThrow('Invalid or expired refresh token');
  });
});
