/** GET /api/progression/achievements — Player achievements + catalog (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlayerAchievements, listAchievements } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  const category = searchParams.get("category") ?? undefined;
  return NextResponse.json({
    catalog: listAchievements(category as never),
    unlocked: getPlayerAchievements(userId),
  });
});
