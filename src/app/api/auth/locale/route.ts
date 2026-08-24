/**
 * POST /api/auth/locale  — update the user's preferred locale
 *
 * This endpoint allows language switching without requiring logout/login.
 * It updates User.locale in the database. The session will automatically
 * reflect the new locale on the next request since it fetches from the database.
 *
 * Body: { locale: "en" | "uz" | "ru" }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { db } from "@/lib/db";
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

  // Return success - the session will automatically reflect the new locale
  // on the next request since it fetches from the database
  return NextResponse.json({
    locale: body.locale,
    message: "Locale updated successfully",
  });
});
