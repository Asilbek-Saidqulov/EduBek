/**
 * GET   /api/live/replay/[id]  — get a replay
 * PATCH /api/live/replay/[id]  — update replay visibility
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getReplay, updateReplay, updateReplayBodySchema } from "@/features/replay";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const replay = await getReplay(authCtx, id);
    return NextResponse.json(replay);
  },
);

export const PATCH = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = updateReplayBodySchema.parse(await req.json());
    const replay = await updateReplay(authCtx, id, body);
    return NextResponse.json(replay);
  },
);
