import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSubscriptionLimits } from "@/features/subscription";

/** GET /api/subscriptions/limits — return the caller's plan-derived limits. */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const limits = await getSubscriptionLimits(ctx);
  return NextResponse.json(limits);
});
