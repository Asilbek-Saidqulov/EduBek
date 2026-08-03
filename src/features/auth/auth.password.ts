/**
 * EduBek — password hashing (Node-only).
 *
 * Wraps `bcryptjs` so that the rest of the codebase does not import the
 * library directly. Two reasons to centralize:
 *
 *   1. The bcrypt cost factor (`env.auth.bcryptRounds`) is a deployment
 *      parameter — we want it to live in one place.
 *   2. Future swap-out (argon2, scrypt) becomes a one-file change.
 *
 * `bcryptjs` is a pure-JS implementation, which is fine for our workload
 * and avoids the native-build pain of `bcrypt`. If we ever need native
 * speed, we can drop in `bcrypt` here without touching callers.
 */

import bcrypt from "bcryptjs";
import { env } from "@/config/env";

/**
 * Hash a plaintext password using bcrypt with the configured cost factor.
 * Returns the canonical bcrypt string (`$2a$<rounds>$<salt><hash>`).
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, env.auth.bcryptRounds);
}

/**
 * Verify a plaintext password against a stored bcrypt hash. Returns `false`
 * on any mismatch (including malformed hashes) — callers should treat a
 * `false` result identically regardless of the underlying cause.
 *
 * `null` / empty hashes always return `false`; this lets the auth service
 * handle "user has no password" (e.g. OAuth-only accounts) uniformly.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}
