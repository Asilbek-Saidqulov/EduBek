import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthContext } from '../auth.context';
import { db } from '@/lib/db';
import * as authCookies from '../auth.cookies';

vi.mock('@/lib/db', () => {
  return {
    db: {
      userSession: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('Session Validation (Safe Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unauthenticated when no session cookie exists', async () => {
    vi.spyOn(authCookies, 'getSessionCookie').mockResolvedValue(undefined);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.userId).toBeNull();
    expect(ctx.email).toBeNull();
    expect(ctx.platformRoles).toEqual([]);
  });

  it('should authenticate valid session token', async () => {
    vi.spyOn(authCookies, 'getSessionCookie').mockResolvedValue('valid-session-token');

    vi.mocked(db.userSession.findFirst).mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      user: {
        id: 'user-123',
        email: 'student@example.com',
        isBanned: false,
        bannedUntil: null,
        roles: [{ role: 'STUDENT', expiresAt: null }],
      },
    } as any);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.userId).toBe('user-123');
    expect(ctx.email).toBe('student@example.com');
    expect(ctx.platformRoles).toContain('STUDENT');
  });

  it('should reject when session is expired in database query (returns null)', async () => {
    vi.spyOn(authCookies, 'getSessionCookie').mockResolvedValue('expired-session-token');
    vi.mocked(db.userSession.findFirst).mockResolvedValue(null);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.userId).toBeNull();
  });

  it('should reject and revoke session if user is banned', async () => {
    vi.spyOn(authCookies, 'getSessionCookie').mockResolvedValue('banned-user-session-token');

    vi.mocked(db.userSession.findFirst).mockResolvedValue({
      id: 'session-banned',
      userId: 'user-banned',
      user: {
        id: 'user-banned',
        email: 'banned@example.com',
        isBanned: true,
        bannedUntil: null,
        roles: [],
      },
    } as any);

    vi.mocked(db.userSession.update).mockResolvedValue({} as any);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.userId).toBeNull();
    expect(db.userSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-banned' },
        data: { revokedAt: expect.any(Date) },
      })
    );
  });

  it('should exclude expired platform roles', async () => {
    vi.spyOn(authCookies, 'getSessionCookie').mockResolvedValue('token-with-roles');

    vi.mocked(db.userSession.findFirst).mockResolvedValue({
      id: 'session-roles',
      userId: 'user-roles',
      user: {
        id: 'user-roles',
        email: 'roles@example.com',
        isBanned: false,
        bannedUntil: null,
        roles: [
          { role: 'STUDENT', expiresAt: null },
          { role: 'ADMIN', expiresAt: new Date(Date.now() - 1000) }, // Expired
        ],
      },
    } as any);

    const ctx = await getAuthContext();
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.platformRoles).toContain('STUDENT');
    expect(ctx.platformRoles).not.toContain('ADMIN');
  });
});
