/**
 * POST /api/exams/[id]/pause  — pause an exam attempt
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { pauseExam } from "@/features/exam";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const state = await pauseExam(authCtx, id);
    return NextResponse.json(state);
  },
);
