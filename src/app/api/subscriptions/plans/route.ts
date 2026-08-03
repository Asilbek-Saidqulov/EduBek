import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getPlans } from "@/features/subscription";

/** GET /api/subscriptions/plans — list all active subscription plans. */
export const GET = withErrorHandler(async () => {
  const plans = await getPlans();
  return NextResponse.json({ plans });
});
