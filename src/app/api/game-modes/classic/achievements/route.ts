/** GET /api/game-modes/classic/achievements — Classic Quiz achievements (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { checkAchievements } from "@/features/game-modes/classic-quiz";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId") ?? undefined;
  const result = typeof checkAchievements === 'function' ? checkAchievements() : checkAchievements;
  return NextResponse.json(result);
});
