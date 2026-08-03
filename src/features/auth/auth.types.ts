/**
 * EduBek — auth DTOs.
 *
 * Plain data shapes exchanged between the auth service, the API routes,
 * and (eventually) the frontend. These are intentionally separate from the
 * Prisma model types so that we can evolve the persistence layer without
 * leaking it through the API.
 */

export interface UserDto {
  id: string;
  email: string;
  emailVerified: string | null;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  locale: string | null;
  isBanned: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  platformRoles: string[];
}

export interface AuthSessionDto {
  /** Signed JWT to send as the session cookie. */
  sessionToken: string;
  /** Opaque refresh token to send as the refresh cookie. */
  refreshToken: string;
  /** Session token expiry (seconds from issuance). */
  sessionExpiresIn: number;
  /** Refresh token expiry (seconds from issuance). */
  refreshExpiresIn: number;
  /** The authenticated user. */
  user: UserDto;
}

/** Payload encoded into the session JWT. */
export interface SessionTokenPayload {
  sub: string; // user id
  email: string;
  /** Snapshot of platform roles at issuance time. */
  roles: string[];
  /**
   * User's preferred locale (ISO 639-1, e.g. "en", "uz", "ru").
   * Phase 4E.1: included in JWT so middleware + services can read it
   * without a DB lookup. May be absent on pre-4E.1 tokens.
   */
  locale?: string;
  /** Issued-at (seconds since epoch). */
  iat?: number;
  /** Expiry (seconds since epoch). */
  exp?: number;
}
