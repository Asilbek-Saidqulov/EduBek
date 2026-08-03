/**
 * POST /api/live/sessions/[id]/end-question-early  — host ends the current question early
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { endQuestionEarly } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await endQuestionEarly(authCtx, id);
    return NextResponse.json(result);
  },
);
