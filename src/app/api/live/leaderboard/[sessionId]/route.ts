/**
 * GET /api/live/leaderboard/[sessionId]  — latest leaderboard for a session
 * (alias for /api/live/sessions/[id]/leaderboard)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getLatestSnapshot } from "@/features/leaderboard";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const snapshot = await getLatestSnapshot(authCtx, sessionId);
    return NextResponse.json(snapshot);
  },
);
