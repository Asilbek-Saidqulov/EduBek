/**
 * POST /api/live/sessions/[id]/pause  — pause the session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { pauseSession } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const session = await pauseSession(authCtx, id);
    return NextResponse.json(session);
  },
);
