/**
 * GET /api/live/rewards/by-session/[sessionId]  — list rewards granted in a session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSessionRewards } from "@/features/reward";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const rewards = await getSessionRewards(authCtx, sessionId);
    return NextResponse.json({ rewards });
  },
);
