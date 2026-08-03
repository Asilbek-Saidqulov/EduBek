/**
 * GET /api/live/lobbies/[sessionId]/can-start  — check countdown prerequisites
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { canStartCountdown } from "@/features/lobby";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const result = await canStartCountdown(authCtx, sessionId);
    return NextResponse.json(result);
  },
);
