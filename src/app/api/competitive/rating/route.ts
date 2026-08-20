/** GET /api/competitive/rating — Competitive platform rating (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getRatingRecord, getRatingHistory, getRatingConfig } from "@/features/competitive-platform";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = resolveTargetUserId(ctx, searchParams.get("userId"));
  return NextResponse.json({ config: getRatingConfig(), rating: userId ? getRatingRecord(userId, (searchParams.get('gameMode') ?? 'classic_quiz') as "classic_quiz" | "treasure_heist" | "empire_builder" | "quiz_royale" | "battle_royale") : null, history: userId ? getRatingHistory(userId).slice(-50) : [] });
});
