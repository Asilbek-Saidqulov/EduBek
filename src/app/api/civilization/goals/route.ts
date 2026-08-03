/** GET+POST /api/civilization/goals — List/create institutional goals */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listGoals, createGoal, updateGoalProgress } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const goals = await listGoals({ organizationId: url.searchParams.get("organizationId")!, type: url.searchParams.get("type") ?? undefined, status: url.searchParams.get("status") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 100) });
  return NextResponse.json({ goals, total: goals.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "update_progress") {
    const body = await req.json();
    const goal = await updateGoalProgress(body.id, body.currentValue, body.aiAssessment);
    return NextResponse.json(goal);
  }
  const body = await req.json();
  const goal = await createGoal(body);
  return NextResponse.json(goal, { status: 201 });
});
