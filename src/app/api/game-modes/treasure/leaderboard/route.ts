/** GET /api/game-modes/treasure/leaderboard — Treasure Heist leaderboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildTreasureLeaderboard } from "@/features/game-modes/treasure-heist";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof buildTreasureLeaderboard === 'function' ? buildTreasureLeaderboard() : buildTreasureLeaderboard;
  return NextResponse.json(result);
});
