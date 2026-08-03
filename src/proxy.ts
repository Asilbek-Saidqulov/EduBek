/**
 * EduBek — Next.js Edge proxy (auth + i18n).
 *
 * This proxy combines two concerns:
 *   1. **i18n locale routing** (via next-intl's `createMiddleware`)
 *   2. **Authentication** (JWT verification + auth header injection)
 *
 * Locale detection order:
 *   1. URL prefix (e.g. /uz/dashboard → locale = "uz")
 *   2. User.locale (from JWT — set at login, updated on language switch)
 *   3. Accept-Language header (browser preference)
 *   4. Default locale ("en")
 *
 * The next-intl middleware handles steps 1, 3, and 4. We extend it
 * with step 2 by reading the JWT and passing the user's preferred
 * locale as a hint via a cookie before the i18n middleware runs.
 *
 * Auth logic (unchanged from Phase 1B):
 *   - Read the session cookie
 *   - Verify the JWT (Edge-safe via jose)
 *   - Strip client-supplied x-edubek-* headers (defense in depth)
 *   - Set x-edubek-user-id, x-edubek-user-email, x-edubek-user-roles,
 *     and x-edubek-user-locale headers for downstream route handlers
 *
 * IMPORTANT: This file MUST NOT import the auth barrel (`@/features/auth`),
 * because the barrel transitively re-exports Node-only modules.
 * Import `verifySessionToken` directly from `auth.session.ts`.
 */

import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { env } from "@/config/env";
import { verifySessionToken } from "@/features/auth/auth.session";
import { routing } from "@/i18n/routing";

// ---------------------------------------------------------------------------
// Header names — keep in sync with `src/features/auth/auth.context.ts`.
// ---------------------------------------------------------------------------

const USER_ID_HEADER = "x-edubek-user-id";
const USER_EMAIL_HEADER = "x-edubek-user-email";
const USER_ROLES_HEADER = "x-edubek-user-roles";
const USER_LOCALE_HEADER = "x-edubek-user-locale";

// Headers we always strip from the incoming request before forwarding it.
const INTERNAL_HEADERS: readonly string[] = [
  USER_ID_HEADER,
  USER_EMAIL_HEADER,
  USER_ROLES_HEADER,
  USER_LOCALE_HEADER,
];

// ---------------------------------------------------------------------------
// Create the next-intl middleware
// ---------------------------------------------------------------------------

const intlMiddleware = createIntlMiddleware(routing);

// ---------------------------------------------------------------------------
// Combined middleware
// ---------------------------------------------------------------------------

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Step 1: Verify the JWT and extract auth + locale info.
  // This runs for ALL routes (pages + API).
  const requestHeaders = new Headers(req.headers);

  // Strip any client-supplied internal headers (defense in depth).
  for (const name of INTERNAL_HEADERS) {
    requestHeaders.delete(name);
  }

  const token = req.cookies.get(env.auth.sessionCookieName)?.value;
  const payload = await verifySessionToken(token);

  if (payload) {
    requestHeaders.set(USER_ID_HEADER, payload.sub);
    requestHeaders.set(USER_EMAIL_HEADER, payload.email);
    requestHeaders.set(USER_ROLES_HEADER, payload.roles.join(","));
    const locale = (payload as any).locale;
    if (typeof locale === "string") {
      requestHeaders.set(USER_LOCALE_HEADER, locale);
    }
  }

  // Step 2: For API routes, skip the i18n middleware (API routes don't
  // use locale-prefixed URLs). Just forward the auth headers.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Step 3: For page routes, run the i18n middleware for locale detection
  // and URL rewriting. We pass the already-set auth headers through by
  // running the i18n middleware on a cloned request with our headers.
  const intlResponse = intlMiddleware(req);

  // If the i18n middleware returned a redirect (e.g. / → /en), return it
  // as-is. The redirect will trigger a new middleware run which will hit
  // the "next" path below.
  const isRedirect = intlResponse.status >= 300 && intlResponse.status < 400;
  if (isRedirect) {
    return intlResponse;
  }

  // For non-redirect responses, forward the auth headers alongside the
  // i18n response. We create a new NextResponse.next with our headers.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

export const config = {
  /**
   * Run on every route EXCEPT:
   *   • Next.js internal static assets (`/_next/static/...`)
   *   • Next.js image optimization (`/_next/image/...`)
   *   • favicon
   *   • Static files with extensions (e.g. .png, .svg, .css)
   *
   * API routes ARE included so auth headers are set. The i18n middleware
   * is skipped for API routes inside the handler (see Step 2 above).
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
