/**
 * POST /api/live/sessions/[id]/skip-countdown  — host skips the remaining countdown
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { skipCountdown } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const session = await skipCountdown(authCtx, id);
    return NextResponse.json(session);
  },
);
