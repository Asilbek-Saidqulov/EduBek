/**
 * POST /api/live/sessions/[id]/resume  — resume the session
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { resumeSession } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const session = await resumeSession(authCtx, id);
    return NextResponse.json(session);
  },
);
