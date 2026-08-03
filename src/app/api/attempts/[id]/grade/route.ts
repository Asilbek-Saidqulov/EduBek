/**
 * POST /api/attempts/[id]/grade  — manually grade a single response
 *   Body: { questionId, pointsAwarded, isCorrect?, feedback? }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  gradeResponse,
  gradeResponseBodySchema,
} from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id: attemptId } = await ctx.params;
    const body = gradeResponseBodySchema.parse(await req.json());
    // questionId comes from the query string.
    const url = new URL(req.url);
    const questionId = url.searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "questionId query param is required" } },
        { status: 400 },
      );
    }
    const result = await gradeResponse(authCtx, attemptId, questionId, body);
    return NextResponse.json(result);
  },
);
