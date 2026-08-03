/** GET/POST /api/commerce-platform/discounts — Discount catalog (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createDiscount, listDiscounts, validateDiscounts, supportsAllDiscountTypes } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");
  return NextResponse.json({ discounts: listDiscounts(active === null ? undefined : active === "true"), types: supportsAllDiscountTypes() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const discount = createDiscount({ ...body, createdBy: ctx.userId });
  return NextResponse.json({ discount }, { status: 201 });
});

/** POST /api/commerce-platform/discounts/validate — Validate discounts for cart */
export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const result = validateDiscounts(body);
  return NextResponse.json({ result });
});
