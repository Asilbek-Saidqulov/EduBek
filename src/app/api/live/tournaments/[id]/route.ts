/**
 * GET /api/live/tournaments/[id]  — get a tournament
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTournament } from "@/features/tournament";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const tournament = await getTournament(authCtx, id);
    return NextResponse.json(tournament);
  },
);
