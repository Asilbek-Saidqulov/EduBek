/**
 * POST /api/live/sessions/[id]/next-round  — host advances to the next question
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startNextRound } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const round = await startNextRound(authCtx, id);
    return NextResponse.json(round, { status: 201 });
  },
);
