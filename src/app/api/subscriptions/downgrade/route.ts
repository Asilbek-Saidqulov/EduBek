import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { downgradeSubscription, downgradeBodySchema } from "@/features/subscription";

/** POST /api/subscriptions/downgrade — downgrade to a lower tier. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = downgradeBodySchema.parse(await req.json());
  const subscription = await downgradeSubscription(ctx, body.newTier);
  return NextResponse.json(subscription);
});
