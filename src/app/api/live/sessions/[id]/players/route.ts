/**
 * GET /api/live/sessions/[id]/players  — list players in the session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSession } from "@/features/live-session";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const session = await getSession(authCtx, id);
    return NextResponse.json({ players: session.players });
  },
);
