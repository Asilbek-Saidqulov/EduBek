/**
 * GET   /api/live/sessions/[id]/players/[playerId]  — get a specific player
 * PATCH /api/live/sessions/[id]/players/[playerId]  — update player (display name / status override)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlayer, updatePlayer, updatePlayerBodySchema } from "@/features/player";

export const GET = withErrorHandler<{ id: string; playerId: string }>(
  async (_req, ctx: RouteContext<{ id: string; playerId: string }>) => {
    const authCtx = await getAuthContext();
    const { playerId } = await ctx.params;
    const player = await getPlayer(authCtx, playerId);
    return NextResponse.json(player);
  },
);

export const PATCH = withErrorHandler<{ id: string; playerId: string }>(
  async (req, ctx: RouteContext<{ id: string; playerId: string }>) => {
    const authCtx = await getAuthContext();
    const { playerId } = await ctx.params;
    const body = updatePlayerBodySchema.parse(await req.json());
    const updated = await updatePlayer(authCtx, playerId, body);
    return NextResponse.json(updated);
  },
);
