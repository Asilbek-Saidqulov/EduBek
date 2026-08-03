import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { validateCoupon, validateCouponBodySchema } from "@/features/coupon";

/** POST /api/coupons/validate — validate a coupon against a prospective amount. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = validateCouponBodySchema.parse(await req.json());
  const result = await validateCoupon(
    ctx,
    body.code,
    body.amount,
    body.scope,
  );
  return NextResponse.json(result);
});
