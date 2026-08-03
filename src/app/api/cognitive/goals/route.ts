/**
 * GET /api/cognitive/goals — List goals + goal templates
 * POST /api/cognitive/goals — Create a new goal
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listGoals, listGoalTemplates, createGoal } from "@/features/cognitive-ai";
import type { GoalKind } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const [goals, templates] = await Promise.all([
    listGoals(),
    Promise.resolve(listGoalTemplates()),
  ]);
  return NextResponse.json({ goals, templates });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { kind, title, description, priority, target } = body as Record<string, unknown>;
  if (!kind || !title) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "kind and title are required" } }, { status: 400 });
  }
  const goal = await createGoal({
    kind: kind as GoalKind,
    title: String(title),
    description: description ? String(description) : undefined,
    priority: typeof priority === "number" ? priority : undefined,
    target: target as { metric: string; baseline: number; target: number; current: number; unit: string } | undefined,
  });
  return NextResponse.json(goal, { status: 201 });
});
