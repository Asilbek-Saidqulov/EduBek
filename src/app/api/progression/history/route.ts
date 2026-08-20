/** GET /api/progression/history — Player match history (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMatchHistory, getCareerTimeline } from "@/features/player-progression";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = resolveTargetUserId(ctx, searchParams.get("userId"));
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  return NextResponse.json({
    matchHistory: getMatchHistory(userId, limit),
    timeline: getCareerTimeline(userId, limit),
  });
});
