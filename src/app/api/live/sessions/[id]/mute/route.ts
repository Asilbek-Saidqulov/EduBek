/**
 * POST /api/live/sessions/[id]/mute  — host toggles a participant's chat mute
 *   Body: { playerId: string, muted: boolean }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { togglePlayerMute } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  playerId: z.string().min(1),
  muted: z.boolean(),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const result = await togglePlayerMute(authCtx, id, body.playerId, body.muted);
    return NextResponse.json(result);
  },
);
