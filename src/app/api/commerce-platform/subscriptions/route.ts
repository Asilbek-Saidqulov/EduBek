/** GET/POST /api/commerce-platform/subscriptions — Subscriptions (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPlans, createSubscriptionPlan, listSubscriptions, createSubscription, supportsAllSubscriptionPlanTypes, supportsAllSubscriptionStatuses } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const userId = searchParams.get("userId") ?? undefined;
  return NextResponse.json({
    plans: listPlans(),
    subscriptions: listSubscriptions(status ?? undefined, userId),
    planTypes: supportsAllSubscriptionPlanTypes(),
    statuses: supportsAllSubscriptionStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.kind === "plan") {
    const plan = createSubscriptionPlan(body);
    return NextResponse.json({ plan }, { status: 201 });
  }
  const subscription = createSubscription(body);
  return NextResponse.json({ subscription }, { status: 201 });
});
