/**
 * GET   /api/assessments/[id]  — get an assessment (with questions)
 * PATCH /api/assessments/[id]  — update an assessment (draft only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getAssessment,
  updateAssessment,
  updateAssessmentBodySchema,
} from "@/features/assessment";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const assessment = await getAssessment(authCtx, id);
    return NextResponse.json(assessment);
  },
);

export const PATCH = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = updateAssessmentBodySchema.parse(await req.json());
    const updated = await updateAssessment(authCtx, id, body);
    return NextResponse.json(updated);
  },
);
