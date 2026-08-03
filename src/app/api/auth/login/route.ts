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
  serializeCookie,
} from "@/features/auth/auth.cookies";
import { login } from "@/features/auth/auth.service";

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

  const userAgent = req.headers.get("user-agent") ?? undefined;
  const ipAddress = getClientIp(req);

  const { session } = await login({
    email: parsed.data.email,
    password: parsed.data.password,
    userAgent,
    ipAddress,
  });

  const response = NextResponse.json({ user: session.user });
  response.headers.append(
    "Set-Cookie",
    serializeCookie({
      ...sessionCookieOptions(),
      value: session.sessionToken,
    }),
  );
  response.headers.append(
    "Set-Cookie",
    serializeCookie({
      ...refreshCookieOptions(),
      value: session.refreshToken,
    }),
  );
  return response;
});

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined;
  const real = req.headers.get("x-real-ip");
  return real ?? undefined;
}
