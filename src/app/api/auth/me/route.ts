/**
 * GET  /api/auth/me — return the authenticated user's profile + platform roles.
 * PATCH /api/auth/me — update editable profile fields (name, username,
 *                       avatarUrl, bio, country). Email, password, locale,
 *                       isBanned, emailVerified are not touched here.
 *
 * Auth: required. Throws 401 if the request is anonymous.
 */
import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler, badRequest, zodIssueToMessageKey } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth/auth.context";
import { getCurrentUser, updateMyProfile } from "@/features/auth/auth.service";
import { updateProfileBodySchema } from "@/features/auth/auth.schema";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);
  const user = await getCurrentUser(ctx.userId!);
  return NextResponse.json({ user });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);

  const body = await req.json().catch(() => null);
  const parsed = updateProfileBodySchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      "Invalid profile payload",
      {
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          code: (i as { code?: string }).code,
          messageKey: zodIssueToMessageKey(i as never),
        })),
      },
      "errors.validationError",
    );
  }

  const user = await updateMyProfile(ctx.userId!, parsed.data);
  return NextResponse.json({ user });
});
