import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCurrentSubscription } from "@/features/subscription";

/** GET /api/subscriptions/current — get the caller's active subscription. */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const subscription = await getCurrentSubscription(ctx);
  return NextResponse.json(subscription);
});
