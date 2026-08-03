/**
 * GET  /api/learning/plans — List the user's study plans
 * POST /api/learning/plans — Create a new study plan
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createStudyPlan, listPlans } from "@/features/learning-planner";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  goalId: z.string().optional(),
  dailyMinutes: z.number().int().min(5).max(480).optional(),
  targetDate: z.string().datetime().optional(),
  startingDifficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
  locale: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const plans = await listPlans(ctx.userId, status ?? undefined);
  return NextResponse.json({ plans, total: plans.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = createSchema.parse(await req.json());
  const plan = await createStudyPlan({
    userId: ctx.userId,
    title: body.title,
    description: body.description,
    goalId: body.goalId,
    dailyMinutes: body.dailyMinutes,
    targetDate: body.targetDate,
    startingDifficulty: body.startingDifficulty,
    locale: ctx.locale ?? body.locale ?? "en",
  });
  return NextResponse.json(plan, { status: 201 });
});
