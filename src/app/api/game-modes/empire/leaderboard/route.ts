/** GET /api/game-modes/empire/leaderboard — Empire Builder leaderboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildEmpireLeaderboard } from "@/features/game-modes/empire-builder";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof buildEmpireLeaderboard === 'function' ? buildEmpireLeaderboard() : buildEmpireLeaderboard;
  return NextResponse.json(result);
});
