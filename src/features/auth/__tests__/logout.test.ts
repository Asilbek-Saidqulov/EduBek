import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logout } from '../auth.service';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => {
  return {
    db: {
      userSession: {
        updateMany: vi.fn(),
      },
    },
  };
});

describe('Logout (Safe Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke session when refreshToken is provided', async () => {
    vi.mocked(db.userSession.updateMany).mockResolvedValue({ count: 1 });

    const result = await logout('some-refresh-token', undefined);

    expect(result).toEqual({ success: true });
    expect(db.userSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          revokedAt: null,
        }),
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      })
    );
  });

  it('should revoke all user sessions when userId is provided', async () => {
    vi.mocked(db.userSession.updateMany).mockResolvedValue({ count: 2 });

    const result = await logout(undefined, 'user-id-123');

    expect(result).toEqual({ success: true });
    expect(db.userSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-id-123',
          revokedAt: null,
        }),
      })
    );
  });

  it('should succeed gracefully when both are undefined (best-effort)', async () => {
    const result = await logout(undefined, undefined);
    expect(result).toEqual({ success: true });
  });

  it('should not throw even if db operation fails', async () => {
    vi.mocked(db.userSession.updateMany).mockRejectedValue(new Error('DB error'));

    const result = await logout('some-token', 'user-id');
    expect(result).toEqual({ success: true });
  });
});
