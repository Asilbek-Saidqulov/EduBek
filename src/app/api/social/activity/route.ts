/** GET /api/social/activity — Social platform activity (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getActivityFeed, getRecentActivity } from "@/features/social-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('userId') ?? ctx.userId; const limit = parseInt(searchParams.get('limit') ?? '50', 10); return NextResponse.json({ feed: getActivityFeed(targetId, limit), recent: getRecentActivity(20) });
});
