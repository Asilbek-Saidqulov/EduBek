import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { cancelSubscription } from "@/features/subscription";

/** POST /api/subscriptions/cancel — cancel the caller's active subscription. */
export const POST = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const subscription = await cancelSubscription(ctx);
  return NextResponse.json(subscription);
});
