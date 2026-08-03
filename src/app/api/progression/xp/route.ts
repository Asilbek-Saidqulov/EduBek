/** GET /api/progression/xp — Player XP events + totals (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getXPEvents, getTotalXP, getSeasonXP, getXPConfig } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  return NextResponse.json({
    totalXP: getTotalXP(userId),
    seasonXP: getSeasonXP(userId),
    config: getXPConfig(),
    recentEvents: getXPEvents(userId).slice(-50),
  });
});
