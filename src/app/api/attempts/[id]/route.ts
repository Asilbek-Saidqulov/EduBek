/**
 * GET /api/attempts/[id]  — get an attempt (with responses)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAttempt } from "@/features/assessment";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const attempt = await getAttempt(authCtx, id);
    return NextResponse.json(attempt);
  },
);
