/** GET+POST /api/civilization/strategy — List/generate strategic plans */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listStrategicPlans, generateStrategicPlan, activatePlan } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const plans = await listStrategicPlans({ organizationId: url.searchParams.get("organizationId")!, horizon: url.searchParams.get("horizon") ?? undefined, status: url.searchParams.get("status") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 50) });
  return NextResponse.json({ plans, total: plans.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "activate") {
    const body = await req.json();
    const plan = await activatePlan(body.id);
    return NextResponse.json(plan);
  }
  const body = await req.json();
  const plan = await generateStrategicPlan({ ...body, createdBy: ctx.userId });
  return NextResponse.json(plan, { status: 201 });
});
