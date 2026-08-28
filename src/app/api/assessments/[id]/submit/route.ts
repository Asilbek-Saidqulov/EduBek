/**
 * POST /api/assessments/[id]/submit  — submit an attempt
 *   Body: { attemptId, responses: [{ questionId, answer, timeSpentMs? }] }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { submitAttempt, submitAttemptBodySchema } from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const json = await req.json();
    const attemptId = url.searchParams.get("attemptId") || json.attemptId;
    if (!attemptId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "attemptId query param or body field is required" } },
        { status: 400 },
      );
    }
    const body = submitAttemptBodySchema.parse(json);
    const result = await submitAttempt(authCtx, attemptId, body);
    return NextResponse.json(result);
  },
);
