/**
 * POST /api/rubrics/[id]/duplicate  — duplicate a rubric
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { duplicateRubric } from "@/features/rubric";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const duplicated = await duplicateRubric(authCtx, id);
    return NextResponse.json(duplicated, { status: 201 });
  },
);
