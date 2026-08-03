/**
 * GET /api/auth/me
 *
 * Return the authenticated user's profile + platform roles.
 *
 * Auth: required. Throws 401 if the request is anonymous.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth/auth.context";
import { getCurrentUser } from "@/features/auth/auth.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);
  const user = await getCurrentUser(ctx.userId!);
  return NextResponse.json({ user });
});
