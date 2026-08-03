/**
 * GET /api/live/sessions/[id]/replay  — get the replay for this session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getReplayBySession } from "@/features/replay";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const replay = await getReplayBySession(authCtx, id);
    return NextResponse.json(replay);
  },
);
