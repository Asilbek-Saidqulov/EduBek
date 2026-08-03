/**
 * POST /api/rubrics/[id]/archive  — archive a rubric
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { archiveRubric } from "@/features/rubric";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await archiveRubric(authCtx, id);
    return NextResponse.json(result);
  },
);
