/** GET /api/social/friends — Social platform friends (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getFriends, getPendingRequests } from "@/features/social-platform";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const targetId = resolveTargetUserId(ctx, searchParams.get('userId')); return NextResponse.json({ friends: getFriends(targetId), pending: getPendingRequests(targetId) });
});
