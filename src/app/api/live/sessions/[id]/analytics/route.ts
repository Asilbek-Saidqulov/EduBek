/**
 * GET /api/live/sessions/[id]/analytics  — session analytics
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSessionAnalytics } from "@/features/live-analytics";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const analytics = await getSessionAnalytics(authCtx, id);
    return NextResponse.json(analytics);
  },
);
