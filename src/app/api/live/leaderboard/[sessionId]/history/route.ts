/**
 * GET /api/live/leaderboard/[sessionId]/history  — all leaderboard snapshots for a session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getHistory } from "@/features/leaderboard";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const history = await getHistory(authCtx, sessionId);
    return NextResponse.json({ snapshots: history });
  },
);
