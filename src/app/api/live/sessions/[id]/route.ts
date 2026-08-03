/**
 * GET   /api/live/sessions/[id]  — get a session (with players + active round)
 * PATCH /api/live/sessions/[id]  — update session settings (lobby only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getSession,
  updateSession,
  updateSessionBodySchema,
} from "@/features/live-session";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const session = await getSession(authCtx, id);
    return NextResponse.json(session);
  },
);

export const PATCH = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = updateSessionBodySchema.parse(await req.json());
    const updated = await updateSession(authCtx, id, body);
    return NextResponse.json(updated);
  },
);
