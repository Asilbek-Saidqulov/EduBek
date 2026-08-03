/**
 * GET /api/live/leaderboard/[sessionId]/round/[round]  — leaderboard for a specific round
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getByRound } from "@/features/leaderboard";

export const GET = withErrorHandler<{ sessionId: string; round: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string; round: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId, round } = await ctx.params;
    const roundNumber = parseInt(round, 10);
    if (isNaN(roundNumber)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "round must be a number" } },
        { status: 400 },
      );
    }
    const snapshot = await getByRound(authCtx, sessionId, roundNumber);
    return NextResponse.json(snapshot);
  },
);
