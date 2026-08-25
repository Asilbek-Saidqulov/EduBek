import { describe, it, expect } from 'vitest';
import {
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
  updateProfileBodySchema,
} from '../auth.schema';

describe('Auth Schemas Validation', () => {
  describe('registerBodySchema', () => {
    it('should validate payload without username (frontend format)', () => {
      const result = registerBodySchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        locale: 'uz',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('jane@example.com');
        expect(result.data.name).toBe('Jane Doe');
        expect(result.data.locale).toBe('uz');
        expect(result.data.country).toBe('UZ');
        expect(result.data.username).toBeUndefined();
      }
    });

    it('should validate payload with username (API format)', () => {
      const result = registerBodySchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        username: 'janedoe_12',
        locale: 'en',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('janedoe_12');
      }
    });

    it('should reject invalid email', () => {
      const result = registerBodySchema.safeParse({
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerBodySchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid username characters', () => {
      const result = registerBodySchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        username: 'jane@invalid!',
      });
      expect(result.success).toBe(false);
    });

    it('should default locale to uz and country to UZ', () => {
      const result = registerBodySchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locale).toBe('uz');
        expect(result.data.country).toBe('UZ');
      }
    });
  });

  describe('loginBodySchema', () => {
    it('should accept valid email and password', () => {
      const result = loginBodySchema.safeParse({
        email: 'user@example.com',
        password: 'SecretPassword1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginBodySchema.safeParse({
        email: 'invalid-email',
        password: 'SecretPassword1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshBodySchema', () => {
    it('should accept optional refreshToken', () => {
      const result1 = refreshBodySchema.safeParse({});
      expect(result1.success).toBe(true);

      const result2 = refreshBodySchema.safeParse({ refreshToken: 'some-token' });
      expect(result2.success).toBe(true);
    });
  });

  describe('updateProfileBodySchema', () => {
    it('should accept valid profile updates', () => {
      const result = updateProfileBodySchema.safeParse({
        name: 'New Name',
        username: 'new_username',
        bio: 'Hello world',
        country: 'UZ',
      });
      expect(result.success).toBe(true);
    });
  });
});
