/**
 * POST /api/learning/plans/:id/items/:itemId/complete — Complete a plan item
 * Body: { actualMinutes?, masteryScore?, accuracy? }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlan, completePlanItem } from "@/features/learning-planner";
import { z } from "zod";

const schema = z.object({
  actualMinutes: z.number().int().min(0).max(480).optional(),
  masteryScore: z.number().min(0).max(1).optional(),
  accuracy: z.number().min(0).max(1).optional(),
});

export const POST = withErrorHandler<{ id: string; itemId: string }>(async (req, ctx) => {
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
  const body = schema.parse(await req.json());
  const item = await completePlanItem(itemId, body);
  return NextResponse.json(item);
});
