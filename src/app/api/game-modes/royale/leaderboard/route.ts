/** GET /api/game-modes/royale/leaderboard — Quiz Royale leaderboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildRoyaleLeaderboard } from "@/features/game-modes/quiz-royale";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof buildRoyaleLeaderboard === 'function' ? buildRoyaleLeaderboard() : buildRoyaleLeaderboard;
  return NextResponse.json(result);
});
