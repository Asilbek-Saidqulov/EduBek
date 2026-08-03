/**
 * GET   /api/live/lobbies/[sessionId]  — get a lobby
 * PATCH /api/live/lobbies/[sessionId]  — update lobby settings
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getLobby, updateLobby, updateLobbyBodySchema } from "@/features/lobby";

export const GET = withErrorHandler<{ sessionId: string }>(
  async (_req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const lobby = await getLobby(authCtx, sessionId);
    return NextResponse.json(lobby);
  },
);

export const PATCH = withErrorHandler<{ sessionId: string }>(
  async (req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const body = updateLobbyBodySchema.parse(await req.json());
    const lobby = await updateLobby(authCtx, sessionId, body);
    return NextResponse.json(lobby);
  },
);
