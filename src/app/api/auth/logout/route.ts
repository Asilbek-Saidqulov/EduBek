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
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  clearCookieOptions,
} from "@/features/auth/auth.cookies";
import { logout } from "@/features/auth/auth.service";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const refreshToken =
    (body as { refreshToken?: string } | null)?.refreshToken ??
    req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  await logout(refreshToken, undefined);

  const response = NextResponse.json({ ok: true });
  
  // Clear cookies via NextResponse.cookies.set for better Next.js 16 compatibility
  response.cookies.set(SESSION_COOKIE_NAME, "", clearCookieOptions());
  response.cookies.set(REFRESH_COOKIE_NAME, "", clearCookieOptions());
  
  return response;
});
