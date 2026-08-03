import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { upgradeSubscription, upgradeBodySchema } from "@/features/subscription";

/** POST /api/subscriptions/upgrade — upgrade to a higher tier. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = upgradeBodySchema.parse(await req.json());
  const subscription = await upgradeSubscription(ctx, body.newTier);
  return NextResponse.json(subscription);
});
