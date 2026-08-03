import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { redeemCoupon, redeemCouponBodySchema } from "@/features/coupon";

/** POST /api/coupons/redeem — validate + record a coupon redemption. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = redeemCouponBodySchema.parse(await req.json());
  const result = await redeemCoupon(
    ctx,
    body.code,
    body.orderId,
    body.amount,
  );
  return NextResponse.json(result, { status: 201 });
});
