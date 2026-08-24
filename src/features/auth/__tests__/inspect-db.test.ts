import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';

describe('Database Inspection', () => {
  beforeAll(async () => {
    // Set required environment variables for tests
    process.env.IP_SALT = 'test-salt-for-testing-only';
  });

  it('should check for users with null passwordHash', async () => {
    const usersWithNullPassword = await db.user.findMany({
      where: {
        passwordHash: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });

    console.log(`Found ${usersWithNullPassword.length} users with null passwordHash`);
    if (usersWithNullPassword.length > 0) {
      console.log('Users with null passwordHash:', usersWithNullPassword.map(u => ({ id: u.id, email: u.email })));
    }

    // This test documents the state - it should pass regardless of results
    expect(usersWithNullPassword).toBeDefined();
  });

  it('should check for sessions with null sessionTokenHash', async () => {
    const sessionsWithNullTokenHash = await db.userSession.findMany({
      where: {
        sessionTokenHash: null,
      },
      select: {
        id: true,
        userId: true,
        sessionTokenHash: true,
      },
    });

    console.log(`Found ${sessionsWithNullTokenHash.length} sessions with null sessionTokenHash`);
    if (sessionsWithNullTokenHash.length > 0) {
      console.log('Sessions with null sessionTokenHash:', sessionsWithNullTokenHash.map(s => ({ id: s.id, userId: s.userId })));
    }

    // This test documents the state - it should pass regardless of results
    expect(sessionsWithNullTokenHash).toBeDefined();
  });

  it('should check total user count', async () => {
    const userCount = await db.user.count();
    console.log(`Total users in database: ${userCount}`);
    expect(userCount).toBeGreaterThanOrEqual(0);
  });

  it('should check total session count', async () => {
    const sessionCount = await db.userSession.count();
    console.log(`Total sessions in database: ${sessionCount}`);
    expect(sessionCount).toBeGreaterThanOrEqual(0);
  });
});
