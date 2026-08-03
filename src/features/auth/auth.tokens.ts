/**
 * EduBek — refresh tokens (Node-only).
 *
 * Refresh tokens are opaque random strings (not JWTs). The server stores
 * only the SHA-256 hash of the token; the plaintext is handed to the client
 * once and never seen again. This means a stolen database cannot be used to
 * mint refresh tokens, and a stolen refresh token can be revoked by
 * deleting its hash from `UserSession`.
 *
 * This file uses Node's `crypto` module and MUST NOT be imported from the
 * Edge runtime. The auth barrel (`src/features/auth/index.ts`) deliberately
 * does NOT re-export this file so that the Edge middleware — which imports
 * `verifySessionToken` directly from `auth.session.ts` — does not pull it
 * in transitively.
 */

import { createHash, randomBytes } from "node:crypto";
import { env } from "@/config/env";

/**
 * Generate a new refresh token. Returns both the plaintext token (to hand
 * to the client) and its SHA-256 hash (to store in `UserSession.refreshTokenHash`).
 */
export function generateRefreshToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

/**
 * Hash a refresh token with SHA-256. The same function is used at issuance
 * (to store the hash) and at verification (to look up the session by hash).
 *
 * SHA-256 is one-way, so the plaintext cannot be recovered from the hash —
 * which is exactly the property we want for an at-rest credential.
 */
export function hashToken(token: string): string {
  return createHash("sha256")
    .update(token + env.auth.refreshSecret)
    .digest("hex");
}

/**
 * Refresh token TTL as a `Date` offset from now. Used by the repository
 * when creating a new `UserSession`.
 */
export function refreshExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + env.auth.refreshTtlSeconds * 1000);
}
