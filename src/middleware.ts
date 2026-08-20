/**
 * EduBek — Next.js Edge middleware (auth + i18n).
 *
 * This middleware combines two concerns:
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

// next-intl's default cookie-based locale detection reads this cookie name.
const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Return a clone of `req` with the `NEXT_LOCALE` cookie set to `locale`,
 * overriding whatever value (if any) the client sent. This lets us feed
 * the user's saved locale (from the JWT) into next-intl's own detection
 * logic instead of duplicating it.
 */
function withLocaleCookie(req: NextRequest, locale: string): NextRequest {
  const headers = new Headers(req.headers);
  const existingCookie = headers.get("cookie") ?? "";
  const otherCookies = existingCookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !c.startsWith(`${NEXT_LOCALE_COOKIE}=`));
  otherCookies.push(`${NEXT_LOCALE_COOKIE}=${locale}`);
  headers.set("cookie", otherCookies.join("; "));
  return new NextRequest(req, { headers });
}

// ---------------------------------------------------------------------------
// Combined middleware
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
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

  let userLocale: string | undefined;
  if (payload) {
    requestHeaders.set(USER_ID_HEADER, payload.sub);
    requestHeaders.set(USER_EMAIL_HEADER, payload.email);
    requestHeaders.set(USER_ROLES_HEADER, payload.roles.join(","));
    const locale = (payload as any).locale;
    if (typeof locale === "string") {
      requestHeaders.set(USER_LOCALE_HEADER, locale);
      userLocale = locale;
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
  // and URL rewriting. next-intl detects the locale from (in order) the
  // URL prefix, the `NEXT_LOCALE` cookie, and the Accept-Language header.
  // To honor the user's *saved* locale (step 2 of the detection order
  // documented above), we inject it as the `NEXT_LOCALE` cookie on a
  // cloned request before invoking the i18n middleware — otherwise the
  // JWT's `locale` claim never reaches next-intl and is silently
  // ignored (it only ever ended up on our own internal header, which
  // next-intl doesn't read). An explicit URL prefix still wins, since
  // next-intl checks that before the cookie.
  const intlRequest = userLocale ? withLocaleCookie(req, userLocale) : req;
  const intlResponse = intlMiddleware(intlRequest);

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
