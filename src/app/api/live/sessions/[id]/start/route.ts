/**
 * POST /api/live/sessions/[id]/start  — start the session (lobby → countdown → in_progress)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startSession, startSessionBodySchema } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = startSessionBodySchema.parse(await req.json());
    const session = await startSession(authCtx, id, body);
    return NextResponse.json(session);
  },
);
