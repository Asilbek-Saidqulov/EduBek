/**
 * POST /api/assessments/[id]/questions  — add questions to an assessment
 * GET  /api/assessments/[id]/questions  — list questions in an assessment
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  addQuestions,
  getAssessment,
  addQuestionsBodySchema,
} from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = addQuestionsBodySchema.parse(await req.json());
    const result = await addQuestions(authCtx, id, body);
    return NextResponse.json(result, { status: 201 });
  },
);

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const assessment = await getAssessment(authCtx, id);
    return NextResponse.json({ questions: assessment.questions });
  },
);
