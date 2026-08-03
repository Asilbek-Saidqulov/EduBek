/**
 * GET /api/live/tournaments/[id]/stats  — tournament statistics summary
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTournamentStats } from "@/features/tournament";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const stats = await getTournamentStats(authCtx, id);
    return NextResponse.json(stats);
  },
);
