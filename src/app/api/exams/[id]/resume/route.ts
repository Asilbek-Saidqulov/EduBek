/**
 * POST /api/exams/[id]/resume  — resume an exam attempt (also handles refresh recovery)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { resumeExam } from "@/features/exam";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await resumeExam(authCtx, id);
    return NextResponse.json(result);
  },
);
