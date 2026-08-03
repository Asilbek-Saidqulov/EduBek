/**
 * POST /api/live/sessions/[id]/kick  — kick a player from the session
 *   Body: { playerId: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { kickPlayer } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  playerId: z.string().min(1),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const result = await kickPlayer(authCtx, id, body.playerId);
    return NextResponse.json(result);
  },
);
