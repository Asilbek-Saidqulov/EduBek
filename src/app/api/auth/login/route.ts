/**
 * POST /api/auth/login
 *
 * Verify credentials, issue a session + refresh token, return the
 * authenticated user.
 *
 * Auth: anonymous.
 * Body: see `loginBodySchema`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { badRequest, withErrorHandler } from "@/lib/errors";
import { loginBodySchema } from "@/features/auth/auth.schema";
import {
  refreshCookieOptions,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/features/auth/auth.cookies";
import { login } from "@/features/auth/auth.service";
import { checkRateLimit } from "@/lib/rate-limiter";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid login payload", {
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Rate limiting based on IP address
  const ipAddress = getClientIp(req) || "unknown";
  const rateLimitResult = checkRateLimit(`login:${ipAddress}`, 5, 60 * 1000); // 5 attempts per minute
  
  if (!rateLimitResult.allowed) {
    throw badRequest("Too many login attempts. Please try again later.", {
      retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
    });
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;

  const { session } = await login({
    email: parsed.data.email,
    password: parsed.data.password,
    userAgent,
    ipAddress,
  });

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

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined;
  const real = req.headers.get("x-real-ip");
  return real ?? undefined;
}
