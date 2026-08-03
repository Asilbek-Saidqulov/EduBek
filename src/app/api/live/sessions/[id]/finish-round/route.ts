/**
 * POST /api/live/sessions/[id]/finish-round  — host ends the current round
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { finishRound } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await finishRound(authCtx, id);
    return NextResponse.json(result);
  },
);
