/**
 * POST /api/assessments/[id]/publish  — publish an assessment
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { publishAssessment } from "@/features/assessment";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const published = await publishAssessment(authCtx, id);
    return NextResponse.json(published);
  },
);
