/**
 * POST /api/auth/register
 *
 * Create a new user account, assign the default `user` platform role,
 * issue a session + refresh token, and return the authenticated user.
 *
 * Auth: anonymous.
 * Body: see `registerBodySchema`.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  badRequest,
  withErrorHandler,
  zodIssueToMessageKey,
} from "@/lib/errors";
import { registerBodySchema } from "@/features/auth/auth.schema";
import {
  refreshCookieOptions,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/features/auth/auth.cookies";
import { register } from "@/features/auth/auth.service";

export const POST = withErrorHandler(
  async (req: NextRequest) => {
    const body = await req.json().catch(() => null);
    const parsed = registerBodySchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid registration payload", {
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          code: (i as any).code,
          messageKey: zodIssueToMessageKey(i as any),
        })),
      }, "errors.validationError");
    }

    const userAgent = req.headers.get("user-agent") ?? undefined;
    const ipAddress = getClientIp(req);

    const { session } = await register({
      ...parsed.data,
      userAgent,
      ipAddress,
    });

    const response = NextResponse.json(
      { 
        user: session.user,
        expiresAt: session.expiresAt,
      },
      { status: 201 },
    );
    
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
  },
);

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined;
  const real = req.headers.get("x-real-ip");
  return real ?? undefined;
}
