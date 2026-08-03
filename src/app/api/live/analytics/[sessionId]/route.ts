/**
 * GET /api/live/analytics/[sessionId]  — session-specific analytics
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSessionAnalytics } from "@/features/live-analytics";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const analytics = await getSessionAnalytics(authCtx, sessionId);
    return NextResponse.json(analytics);
  },
);
