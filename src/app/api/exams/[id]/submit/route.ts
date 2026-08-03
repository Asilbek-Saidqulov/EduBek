/**
 * POST /api/exams/[id]/submit  — submit an exam attempt
 *   Body: { responses: [{ questionId, answer, timeSpentMs? }] }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { submitExam, submitAttemptBodySchema } from "@/features/exam";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = submitAttemptBodySchema.parse(await req.json());
    const result = await submitExam(authCtx, id, body);
    return NextResponse.json(result);
  },
);
