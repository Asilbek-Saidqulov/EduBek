/** GET /api/study-groups/:id/leaderboard — Group XP leaderboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getGroupLeaderboard } from "@/features/collaboration";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const leaderboard = await getGroupLeaderboard(id);
  return NextResponse.json({ leaderboard, total: leaderboard.length });
});
