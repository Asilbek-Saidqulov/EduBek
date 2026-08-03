/**
 * GET  /api/learning/goals — List the user's goals
 * POST /api/learning/goals — Create a new goal
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createGoal, listGoals } from "@/features/learning-planner";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  constraints: z.object({
    targetDate: z.string().datetime().optional(),
    dailyMinutes: z.number().int().min(5).max(480).optional(),
    currentLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    topics: z.array(z.string()).optional(),
  }).optional(),
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
  const goals = await listGoals(ctx.userId, status ?? undefined);
  return NextResponse.json({ goals, total: goals.length });
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
  const goal = await createGoal({
    userId: ctx.userId,
    title: body.title,
    description: body.description,
    constraints: body.constraints,
  });
  return NextResponse.json(goal, { status: 201 });
});
