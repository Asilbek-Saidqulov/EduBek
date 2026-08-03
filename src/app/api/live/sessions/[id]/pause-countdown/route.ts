/**
 * POST /api/live/sessions/[id]/pause-countdown  — host pauses the pre-game countdown
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { pauseCountdown } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await pauseCountdown(authCtx, id);
    return NextResponse.json(result);
  },
);
