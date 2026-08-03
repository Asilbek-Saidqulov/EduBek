/**
 * POST /api/assessments/[id]/archive  — archive an assessment
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { archiveAssessment } from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const archived = await archiveAssessment(authCtx, id);
    return NextResponse.json(archived);
  },
);
