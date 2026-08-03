/**
 * GET /api/live/spectate/[sessionId]  — get a read-only session view for spectators
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSessionView } from "@/features/spectator";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const view = await getSessionView(authCtx, sessionId);
    return NextResponse.json(view);
  },
);
