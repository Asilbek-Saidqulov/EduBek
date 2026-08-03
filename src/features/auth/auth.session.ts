/**
 * EduBek — session token (Edge-safe).
 *
 * Session tokens are signed JWTs. We use `jose` (not the Node-only `crypto`
 * module) so that this file can be imported from the Next.js Edge runtime
 * (middleware, route handlers configured with `runtime = "edge"`).
 *
 * Token shape (see `SessionTokenPayload`):
 *   • sub     — user id
 *   • email   — user email (so middleware can set x-edubek-user-email
 *               without a DB lookup)
 *   • roles   — platform roles snapshot
 *   • iat/exp — standard JWT claims, set automatically by `SignJWT`
 *
 * Secrets come from `env.auth.sessionSecret`. Token TTL is
 * `env.auth.sessionTtlSeconds` (default 15 minutes).
 *
 * The middleware imports `verifySessionToken` *directly* from this file
 * (NOT from the auth barrel) to avoid pulling Node-only modules (bcryptjs,
 * Prisma, jose's Node crypto shim) into the Edge bundle.
 */

import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";
import type { SessionTokenPayload } from "@/features/auth/auth.types";

const ISSUER = "edubek";
const AUDIENCE = "edubek:session";

function secretBytes(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session token. The returned string is the compact JWT
 * representation suitable for an HTTP-only cookie.
 */
export async function signSessionToken(
  payload: Omit<SessionTokenPayload, "iat" | "exp">,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + env.auth.sessionTtlSeconds;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setExpirationTime(exp)
    .sign(secretBytes(env.auth.sessionSecret));
}

/**
 * Verify a session token. Returns the decoded payload on success, or
 * `null` on any failure (bad signature, expired, malformed, …). Never
 * throws — callers can simply treat `null` as "no session".
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionTokenPayload | null> {
  if (!token || token.length === 0) return null;
  try {
    const { payload } = await jwtVerify(token, secretBytes(env.auth.sessionSecret), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string") return null;
    if (typeof payload.email !== "string") return null;
    if (!Array.isArray(payload.roles)) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles as string[],
      // Phase 4E.1: locale may be absent on pre-4E.1 tokens
      locale: typeof payload.locale === "string" ? payload.locale : undefined,
      iat: typeof payload.iat === "number" ? payload.iat : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}
