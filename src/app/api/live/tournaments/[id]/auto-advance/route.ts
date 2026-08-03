/**
 * POST /api/live/tournaments/[id]/auto-advance  — auto-advance bye/forfeit matches
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { autoAdvanceReadyMatches } from "@/features/tournament";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await autoAdvanceReadyMatches(authCtx, id);
    return NextResponse.json(result);
  },
);
