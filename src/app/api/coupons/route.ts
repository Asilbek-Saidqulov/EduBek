import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createCoupon,
  getCoupons,
  createCouponBodySchema,
} from "@/features/coupon";

/**
 * GET /api/coupons — list active coupons.
 * Pass ?includeInactive=true to include inactive ones (admin only).
 */
export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const coupons = await getCoupons(ctx, includeInactive);
  return NextResponse.json({ coupons });
});

/** POST /api/coupons — create a new coupon (admin only). */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createCouponBodySchema.parse(await req.json());
  const coupon = await createCoupon(ctx, body);
  return NextResponse.json(coupon, { status: 201 });
});
