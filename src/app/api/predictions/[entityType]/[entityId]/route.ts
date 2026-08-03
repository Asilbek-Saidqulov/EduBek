/**
 * GET  /api/predictions/:entityType/:entityId — Get learning prediction for the current user + entity
 * POST /api/predictions/:entityType/:entityId — Re-compute the prediction
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPrediction, predictLearningOutcome } from "@/features/knowledge-intelligence";

export const GET = withErrorHandler<{ entityType: string; entityId: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { entityType, entityId } = await ctx.params;
  const prediction = await getPrediction(authCtx.userId, entityType, entityId);
  return NextResponse.json(prediction);
});

export const POST = withErrorHandler<{ entityType: string; entityId: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { entityType, entityId } = await ctx.params;
  const prediction = await predictLearningOutcome({
    userId: authCtx.userId,
    entityType,
    entityId,
  });
  return NextResponse.json(prediction, { status: 201 });
});
