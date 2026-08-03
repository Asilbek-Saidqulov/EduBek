/**
 * GET /api/live/tournaments/[id]/matches/history  — chronological match history
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMatchHistory } from "@/features/tournament";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const history = await getMatchHistory(authCtx, id);
    return NextResponse.json({ matches: history });
  },
);
