/** GET /api/progression/levels — Player level info + curve (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getLevelInfo, getLevelCurve, getLevelUpEvents } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  return NextResponse.json({
    levelInfo: getLevelInfo(userId),
    curve: getLevelCurve(),
    levelUpHistory: getLevelUpEvents(userId).slice(-20),
  });
});
