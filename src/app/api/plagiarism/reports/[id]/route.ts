/**
 * GET /api/plagiarism/reports/[id]  — get a single plagiarism report
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getReport } from "@/features/plagiarism";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const report = await getReport(authCtx, id);
    return NextResponse.json(report);
  },
);
