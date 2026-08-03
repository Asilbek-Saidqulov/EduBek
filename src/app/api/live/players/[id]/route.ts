/**
 * GET /api/live/players/[id]  — get a player record
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlayer } from "@/features/player";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const player = await getPlayer(authCtx, id);
    return NextResponse.json(player);
  },
);
