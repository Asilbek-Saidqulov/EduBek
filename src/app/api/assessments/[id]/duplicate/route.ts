/**
 * POST /api/assessments/[id]/duplicate  — duplicate an assessment
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { duplicateAssessment } from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const duplicated = await duplicateAssessment(authCtx, id);
    return NextResponse.json(duplicated, { status: 201 });
  },
);
