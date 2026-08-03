/**
 * POST /api/auth/logout
 *
 * Revoke the refresh token (if present) and clear both auth cookies.
 *
 * Auth: best-effort — works whether or not the caller is authenticated.
 * Body: optional `{ refreshToken: string }`. When omitted, the route reads
 *       the refresh cookie.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { env } from "@/config/env";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  clearCookieOptions,
  serializeCookie,
} from "@/features/auth/auth.cookies";
import { logout } from "@/features/auth/auth.service";
import { USER_ID_HEADER } from "@/features/auth/auth.context";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const refreshToken =
    (body as { refreshToken?: string } | null)?.refreshToken ??
    req.cookies.get(env.auth.refreshCookieName)?.value;
  const actorId = req.headers.get(USER_ID_HEADER) ?? undefined;

  await logout(refreshToken, actorId);

  const response = NextResponse.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    serializeCookie(clearCookieOptions(SESSION_COOKIE_NAME)),
  );
  response.headers.append(
    "Set-Cookie",
    serializeCookie(clearCookieOptions(REFRESH_COOKIE_NAME)),
  );
  return response;
});
