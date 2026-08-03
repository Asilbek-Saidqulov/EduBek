/** GET /api/learning/plans/:id/estimate — Estimate plan completion date */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlan, estimateCompletion } from "@/features/learning-planner";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
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
  const estimate = await estimateCompletion(id);
  return NextResponse.json(estimate);
});
