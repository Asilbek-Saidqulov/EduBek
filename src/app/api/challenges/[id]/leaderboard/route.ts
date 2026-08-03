/** GET /api/challenges/:id/leaderboard — Get the challenge leaderboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getChallengeLeaderboard } from "@/features/collaboration";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const leaderboard = await getChallengeLeaderboard(id, limit);
  return NextResponse.json({ leaderboard, total: leaderboard.length });
});
