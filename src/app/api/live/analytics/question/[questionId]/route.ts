/**
 * GET /api/live/analytics/question/[questionId]  — per-question analytics
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPerQuestionAnalytics } from "@/features/live-analytics";

export const GET = withErrorHandler<{ questionId: string }>(
  async (_req, ctx: RouteContext<{ questionId: string }>) => {
    const authCtx = await getAuthContext();
    const { questionId } = await ctx.params;
    const result = await getPerQuestionAnalytics(authCtx, questionId);
    return NextResponse.json(result);
  },
);
