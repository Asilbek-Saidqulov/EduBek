/** GET/POST /api/commerce-platform/purchases — Purchases (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPurchases, createPurchase, supportsAllPurchaseStatuses } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const buyerId = searchParams.get("buyerId") ?? undefined;
  return NextResponse.json({ purchases: listPurchases(status ?? undefined, buyerId), statuses: supportsAllPurchaseStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const purchase = createPurchase({ ...body, buyerId: body.buyerId ?? ctx.userId });
  return NextResponse.json({ purchase }, { status: 201 });
});
