/**
 * GET    /api/learning/plans/:id — Get a single study plan with items
 * PATCH  /api/learning/plans/:id — Update plan (title/description/status/metadata)
 *
 * Lifecycle actions (pause / resume / finish / archive) live under their
 * own sub-routes to keep the surface clean.
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlan, updateStudyPlan } from "@/features/learning-planner";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const plan = await getPlan(id);
  if (!plan || plan.userId !== authCtx.userId) {
    throw notFound("Plan not found");
  }
  return NextResponse.json(plan);
});

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
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
  const body = patchSchema.parse(await req.json());
  const plan = await updateStudyPlan(id, body);
  return NextResponse.json(plan);
});
