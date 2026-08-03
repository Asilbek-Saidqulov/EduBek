/**
 * POST /api/live/sessions/[id]/ready  — participant marks themselves ready (or not)
 *   Body: { ready: boolean }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { setPlayerReady } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  ready: z.boolean(),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const result = await setPlayerReady(authCtx, id, body.ready);
    return NextResponse.json(result);
  },
);
