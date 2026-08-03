/**
 * POST /api/auth/locale  — update the user's preferred locale
 *
 * Phase 4E.1: This endpoint allows language switching without
 * requiring logout/login. It:
 *   1. Updates User.locale in the database
 *   2. Re-issues the session JWT with the new locale
 *   3. Sets the new JWT cookie
 *
 * The frontend should call this endpoint when the user selects a
 * different language, then navigate to the new locale-prefixed URL.
 *
 * Body: { locale: "en" | "uz" | "ru" }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { signSessionToken } from "@/features/auth/auth.session";
import { env } from "@/config/env";
import { locales } from "@/i18n/routing";

const bodySchema = z.object({
  locale: z.enum([...locales] as [string, ...string[]]),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required", messageKey: "errors.unauthorized" } },
      { status: 401 },
    );
  }
  const body = bodySchema.parse(await req.json());

  // Update the user's locale in the database
  await db.user.update({
    where: { id: ctx.userId },
    data: { locale: body.locale },
  });

  // Re-issue the session JWT with the new locale
  const sessionToken = await signSessionToken({
    sub: ctx.userId,
    email: ctx.email!,
    roles: ctx.platformRoles,
    locale: body.locale,
  });

  // Set the new session cookie
  const response = NextResponse.json({
    locale: body.locale,
    message: "Locale updated successfully",
  });
  response.cookies.set(env.auth.sessionCookieName, sessionToken, {
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: env.auth.sessionTtlSeconds,
  });

  return response;
});
