/**
 * GET /api/live/sessions/[id]/leaderboard  — latest leaderboard snapshot
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getLatestSnapshot } from "@/features/leaderboard";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const snapshot = await getLatestSnapshot(authCtx, id);
    return NextResponse.json(snapshot);
  },
);
