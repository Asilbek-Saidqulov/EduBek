/**
 * POST /api/auth/refresh
 *
 * Exchange a valid refresh token for a new session + refresh token pair.
 * The old refresh token is revoked (rotation).
 *
 * Auth: refresh token (cookie or body).
 * Body: optional `{ refreshToken: string }`. When omitted, the route reads
 *       the refresh cookie.
 */

import { NextResponse, type NextRequest } from "next/server";
import { badRequest, withErrorHandler } from "@/lib/errors";
import { refreshBodySchema } from "@/features/auth/auth.schema";
import {
  refreshCookieOptions,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/features/auth/auth.cookies";
import { refreshSession } from "@/features/auth/auth.service";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = refreshBodySchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid refresh payload", {
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  const refreshToken =
    parsed.data.refreshToken ??
    req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  const { session } = await refreshSession(refreshToken);

  const response = NextResponse.json({ 
    user: session.user,
    expiresAt: session.expiresAt,
  });
  
  // Set cookies via NextResponse.cookies.set for better Next.js 16 compatibility
  response.cookies.set(
    SESSION_COOKIE_NAME,
    session.sessionToken,
    sessionCookieOptions()
  );
  response.cookies.set(
    REFRESH_COOKIE_NAME,
    session.refreshToken,
    refreshCookieOptions()
  );
  
  return response;
});
