/**
 * GET  /api/challenges/:id/leaderboard — Get the leaderboard
 * POST /api/challenges/:id/progress — Update user's progress
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getChallengeLeaderboard, updateProgress } from "@/features/collaboration";
import { z } from "zod";

const postSchema = z.object({
  progressDelta: z.number().optional(),
  progressAbsolute: z.number().optional(),
});

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

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const body = postSchema.parse(await req.json());
  const participation = await updateProgress({
    challengeId: id,
    userId: authCtx.userId,
    progressDelta: body.progressDelta,
    progressAbsolute: body.progressAbsolute,
  });
  return NextResponse.json(participation);
});
