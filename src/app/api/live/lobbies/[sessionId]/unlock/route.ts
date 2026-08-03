/**
 * POST /api/live/lobbies/[sessionId]/unlock  — unlock the lobby
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { unlockLobby } from "@/features/lobby";

export const POST = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const lobby = await unlockLobby(authCtx, sessionId);
    return NextResponse.json(lobby);
  },
);
