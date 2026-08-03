/**
 * EduBek — auth cookie helpers.
 *
 * Next.js exposes two cookie APIs:
 *   • `cookies()` from `next/headers`  — for Server Components / route
 *     handlers (async, await-able in Next 16).
 *   • The `Set-Cookie` header on a `NextResponse` — for setting cookies
 *     alongside a JSON response from a route handler.
 *
 * This module centralizes the *options* (path, httpOnly, secure, sameSite,
 * maxAge) and the cookie *names* so that every call site that sets or
 * clears a cookie uses identical settings. Mismatched options between
 * "set" and "clear" are a classic cause of phantom sessions.
 */

import { env } from "@/config/env";

// Minimal cookie options type — avoids importing from "next" which doesn't
// export CookieOptions in all versions.
export interface CookieOptions {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
}

// ---------------------------------------------------------------------------
// Names — single source of truth.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE_NAME = env.auth.sessionCookieName;
export const REFRESH_COOKIE_NAME = env.auth.refreshCookieName;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Options for the short-lived session cookie (the JWT). */
export function sessionCookieOptions(): CookieOptions {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: env.auth.sessionTtlSeconds,
  };
}

/** Options for the long-lived refresh cookie (opaque random string). */
export function refreshCookieOptions(): CookieOptions {
  return {
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env.auth.refreshTtlSeconds,
  };
}

/**
 * Options used when *clearing* a cookie. The critical bit: `maxAge` must be
 * `0` (or absent) and `expires` must be in the past; we set both for
 * belt-and-braces, because different browsers (and different proxies) honor
 * different attributes.
 */
export function clearCookieOptions(name: string): CookieOptions {
  return {
    name,
    value: "",
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: "lax",
    path: name === REFRESH_COOKIE_NAME ? "/api/auth" : "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

/**
 * Serialize a cookie header value from the given options. Used when we
 * need to write directly to a `Set-Cookie` header (e.g. on a
 * `NextResponse`) rather than via `cookies().set()`.
 */
export function serializeCookie(opts: CookieOptions): string {
  const parts: string[] = [`${opts.name}=${opts.value}`];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (typeof opts.maxAge === "number") parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  return parts.join("; ");
}
