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
    const body = submitAttemptBodySchema.parse(await req.json());
    // The attemptId is in the body — the route is /api/assessments/[id]/submit
    // for symmetry with /start, but the actual attempt is identified by the
    // attemptId field so the service can verify ownership.
    const url = new URL(req.url);
    const attemptId = url.searchParams.get("attemptId");
    if (!attemptId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "attemptId query param is required" } },
        { status: 400 },
      );
    }
    const result = await submitAttempt(authCtx, attemptId, body);
    return NextResponse.json(result);
  },
);
