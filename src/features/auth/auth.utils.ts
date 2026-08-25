import crypto from "crypto";
import bcrypt from "bcryptjs";

// Bcrypt cost factor - 10 is a good balance between security and performance
// For higher security requirements, consider 12, but be aware of performance impact
const BCRYPT_COST = 10;

// Token length in bytes (32 bytes = 256 bits)
const TOKEN_BYTES = 32;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token
 * @returns Random token as hex string
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Hash a token using SHA-256 for database storage
 * @param token - Raw token
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Hash an IP address with a secret salt for secure storage
 * @param ip - IP address string
 * @param salt - Secret salt from environment
 * @returns Hashed IP address
 */
export function hashIp(ip: string, salt?: string): string {
  const effectiveSalt = salt !== undefined ? salt : getIpSalt();
  if (!effectiveSalt) {
    throw new Error("IP_SALT environment variable is required for IP hashing");
  }
  return crypto.createHash("sha256").update(ip + effectiveSalt).digest("hex");
}

export function getIpSalt(): string {
  const salt = process.env.IP_SALT || process.env.EDUBEK_SESSION_SECRET || "edubek_ip_salt_fallback_key";
  return salt;
}

/**
 * Calculate session expiration date
 * @param days - Number of days until expiration
 * @returns Date object
 */
export function calculateExpiration(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Check if a session is expired
 * @param expiresAt - Session expiration date
 * @returns True if session is expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Check if a session is revoked
 * @param revokedAt - Session revocation date
 * @returns True if session is revoked
 */
export function isSessionRevoked(revokedAt: Date | null): boolean {
  return revokedAt !== null;
}

/**
 * Check if a user is banned
 * @param isBanned - User ban status
 * @param bannedUntil - Temporary ban expiration date
 * @returns True if user is currently banned
 */
export function isUserBanned(isBanned: boolean, bannedUntil: Date | null): boolean {
  if (!isBanned) return false;
  if (!bannedUntil) return true; // Permanent ban
  return new Date() < bannedUntil; // Temporary ban still active
}

/**
 * Normalize email to lowercase and trim
 * @param email - Email address
 * @returns Normalized email
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalize username by trimming and converting to lowercase if desired
 * @param username - Username
 * @returns Normalized username
 */
export function normalizeUsername(username: string): string {
  return username.trim();
}

/**
 * Safely generate a unique username candidate from email or name
 * @param emailOrName - User's email or full name
 * @returns Clean username candidate
 */
export function generateUsernameCandidate(emailOrName: string): string {
  const base = emailOrName
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 18);
  const cleanBase = base.length >= 3 ? base : `user_${base || "edu"}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${cleanBase.slice(0, 24)}_${suffix}`;
}

