import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { subscribe, subscribeBodySchema } from "@/features/subscription";

/** POST /api/subscriptions/subscribe — start a new subscription. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = subscribeBodySchema.parse(await req.json());
  const subscription = await subscribe(ctx, body.planTier, body.billingCycle);
  return NextResponse.json(subscription, { status: 201 });
});
