import { describe, it, expect } from 'vitest';
import { requireAuth, requireRole, type AuthContext } from '../auth.context';

describe('Authorization (Safe Unit Tests)', () => {
  it('should throw unauthorized when context is not authenticated', () => {
    const ctx: AuthContext = {
      userId: null,
      email: null,
      platformRoles: [],
      isAuthenticated: false,
    };

    expect(() => requireAuth(ctx)).toThrow();
  });

  it('should allow authenticated context via requireAuth', () => {
    const ctx: AuthContext = {
      userId: 'user-123',
      email: 'user@example.com',
      platformRoles: ['STUDENT'],
      isAuthenticated: true,
    };

    expect(() => requireAuth(ctx)).not.toThrow();
  });

  it('should allow user with required role via requireRole', () => {
    const ctx: AuthContext = {
      userId: 'user-123',
      email: 'admin@example.com',
      platformRoles: ['ADMIN'],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, 'ADMIN')).not.toThrow();
  });

  it('should reject user with insufficient role via requireRole', () => {
    const ctx: AuthContext = {
      userId: 'user-123',
      email: 'student@example.com',
      platformRoles: ['STUDENT'],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, 'ADMIN')).toThrow();
  });

  it('should allow SUPERADMIN for any role check', () => {
    const ctx: AuthContext = {
      userId: 'user-super',
      email: 'superadmin@example.com',
      platformRoles: ['SUPERADMIN'],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, 'STUDENT')).not.toThrow();
    expect(() => requireRole(ctx, 'CREATOR')).not.toThrow();
    expect(() => requireRole(ctx, 'ADMIN')).not.toThrow();
  });

  it('should allow ADMIN for any role check', () => {
    const ctx: AuthContext = {
      userId: 'user-admin',
      email: 'admin@example.com',
      platformRoles: ['ADMIN'],
      isAuthenticated: true,
    };

    expect(() => requireRole(ctx, 'STUDENT')).not.toThrow();
    expect(() => requireRole(ctx, 'CREATOR')).not.toThrow();
  });
});
