import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { renewSubscription } from "@/features/subscription";

/** POST /api/subscriptions/renew — extend the current subscription period. */
export const POST = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const subscription = await renewSubscription(ctx);
  return NextResponse.json(subscription);
});
