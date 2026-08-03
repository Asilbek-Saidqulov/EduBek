/**
 * DELETE /api/assessments/[id]/questions/[questionId]  — remove a question
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { removeQuestion } from "@/features/assessment";

export const DELETE = withErrorHandler<{ id: string; questionId: string }>(
  async (_req, ctx: RouteContext<{ id: string; questionId: string }>) => {
    const authCtx = await getAuthContext();
    const { id, questionId } = await ctx.params;
    const result = await removeQuestion(authCtx, id, questionId);
    return NextResponse.json(result);
  },
);
