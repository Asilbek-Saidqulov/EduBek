import { beforeAll } from 'vitest';

beforeAll(async () => {
  // Set required environment variables for tests (safe, isolated in memory)
  process.env.IP_SALT = process.env.IP_SALT || 'test-salt-for-testing-only';
  process.env.EDUBEK_SESSION_SECRET = process.env.EDUBEK_SESSION_SECRET || 'test-session-secret-key-32charslong!';
  process.env.EDUBEK_REFRESH_SECRET = process.env.EDUBEK_REFRESH_SECRET || 'test-refresh-secret-key-32charslong!';
});
