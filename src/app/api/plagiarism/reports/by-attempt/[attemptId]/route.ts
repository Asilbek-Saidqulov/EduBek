/**
 * GET /api/plagiarism/reports/by-attempt/[attemptId]  — list reports for an attempt
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReportsByAttempt } from "@/features/plagiarism";

export const GET = withErrorHandler<{ attemptId: string }>(
  async (_req, ctx: RouteContext<{ attemptId: string }>) => {
    const authCtx = await getAuthContext();
    const { attemptId } = await ctx.params;
    const reports = await listReportsByAttempt(authCtx, attemptId);
    return NextResponse.json({ reports });
  },
);
