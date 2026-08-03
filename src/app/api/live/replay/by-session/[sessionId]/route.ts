/**
 * GET /api/live/replay/by-session/[sessionId]  — get the replay for a session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getReplayBySession } from "@/features/replay";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const replay = await getReplayBySession(authCtx, sessionId);
    return NextResponse.json(replay);
  },
);
