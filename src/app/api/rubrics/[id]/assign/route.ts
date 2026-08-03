/**
 * POST /api/rubrics/[id]/assign  — attach a rubric to an assessment
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  assignRubricToAssessment,
  assignRubricBodySchema,
} from "@/features/rubric";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = assignRubricBodySchema.parse(await req.json());
    const result = await assignRubricToAssessment(authCtx, id, body);
    return NextResponse.json(result);
  },
);
