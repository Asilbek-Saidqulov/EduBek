/**
 * POST /api/live/tournaments/[id]/start  — generate the bracket and start
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startTournament } from "@/features/tournament";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const tournament = await startTournament(authCtx, id);
    return NextResponse.json(tournament);
  },
);
