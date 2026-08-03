/**
 * POST /api/assessments/[id]/start  — start (or resume) an attempt
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startAttempt } from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const attempt = await startAttempt(authCtx, id);
    return NextResponse.json(attempt, { status: 201 });
  },
);
