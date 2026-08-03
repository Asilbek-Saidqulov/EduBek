/** POST /api/learning/plans/:id/resume — Resume a paused plan */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlan, resumePlan } from "@/features/learning-planner";

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const existing = await getPlan(id);
  if (!existing || existing.userId !== authCtx.userId) {
    throw notFound("Plan not found");
  }
  const plan = await resumePlan(id);
  return NextResponse.json(plan);
});
