/**
 * POST /api/live/lobbies/[sessionId]/waiting-room  — approve or reject waiting-room players
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { approveWaitingRoom, approveWaitingRoomBodySchema } from "@/features/lobby";

export const POST = withErrorHandler<{ sessionId: string }>(
  async (req, ctx: RouteContext<{ sessionId: string }>) => {
    const authCtx = await getAuthContext();
    const { sessionId } = await ctx.params;
    const body = approveWaitingRoomBodySchema.parse(await req.json());
    const result = await approveWaitingRoom(authCtx, sessionId, body);
    return NextResponse.json(result);
  },
);
