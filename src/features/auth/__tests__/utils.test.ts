import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  hashIp,
  calculateExpiration,
  isSessionExpired,
  isSessionRevoked,
  isUserBanned,
} from '../auth.utils';

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt includes salt
    });
  });

  describe('Token Generation', () => {
    it('should generate secure token with crypto.randomBytes', () => {
      const token = generateSecureToken();

      expect(token).toBeDefined();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Hashing', () => {
    it('should hash token with SHA-256', () => {
      const token = generateSecureToken();
      const hash = hashToken(token);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA-256 = 64 hex chars
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce same hash for same token', () => {
      const token = generateSecureToken();
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('IP Hashing', () => {
    it('should hash IP with salt', () => {
      const ip = '192.168.1.1';
      const salt = 'test-salt';
      const hash = hashIp(ip, salt);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should throw error if salt is missing', () => {
      const ip = '192.168.1.1';

      expect(() => hashIp(ip, '')).toThrow('IP_SALT environment variable is required');
    });

    it('should produce different hashes for same IP with different salts', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIp(ip, 'salt1');
      const hash2 = hashIp(ip, 'salt2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Expiration Calculation', () => {
    it('should calculate expiration date', () => {
      const expiration = calculateExpiration(7);

      expect(expiration).toBeInstanceOf(Date);
      const now = new Date();
      const diffMs = expiration.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      // Allow for 6 or 7 days due to timezone/day boundary
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(7);
    });
  });

  describe('Session Validation', () => {
    it('should detect expired session', () => {
      const expiredDate = new Date(Date.now() - 1000);
      expect(isSessionExpired(expiredDate)).toBe(true);
    });

    it('should not detect valid session as expired', () => {
      const validDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now
      expect(isSessionExpired(validDate)).toBe(false);
    });

    it('should detect revoked session', () => {
      const revokedDate = new Date();
      expect(isSessionRevoked(revokedDate)).toBe(true);
    });

    it('should not detect non-revoked session as revoked', () => {
      expect(isSessionRevoked(null)).toBe(false);
    });
  });

  describe('Ban Detection', () => {
    it('should detect permanently banned user', () => {
      expect(isUserBanned(true, null)).toBe(true);
    });

    it('should detect temporarily banned user with active ban', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      expect(isUserBanned(true, futureDate)).toBe(true);
    });

    it('should not detect banned user if ban is expired', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      expect(isUserBanned(true, pastDate)).toBe(false);
    });

    it('should not detect non-banned user', () => {
      expect(isUserBanned(false, null)).toBe(false);
      expect(isUserBanned(false, new Date())).toBe(false);
    });
  });
});
