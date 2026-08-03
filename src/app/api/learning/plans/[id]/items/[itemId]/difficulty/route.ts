/** POST /api/learning/plans/:id/items/:itemId/difficulty — Auto-adjust item difficulty based on recent performance */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlan, adjustPlanItemDifficulty } from "@/features/learning-planner";

export const POST = withErrorHandler<{ id: string; itemId: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id, itemId } = await ctx.params;
  const existing = await getPlan(id);
  if (!existing || existing.userId !== authCtx.userId) {
    throw notFound("Plan not found");
  }
  const result = await adjustPlanItemDifficulty(itemId);
  return NextResponse.json(result);
});
