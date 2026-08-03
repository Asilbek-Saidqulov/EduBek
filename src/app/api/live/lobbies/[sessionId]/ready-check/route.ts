/**
 * GET /api/live/lobbies/[sessionId]/ready-check  — get the ready-check summary
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getReadyCheck } from "@/features/lobby";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const result = await getReadyCheck(authCtx, sessionId);
    return NextResponse.json(result);
  },
);
