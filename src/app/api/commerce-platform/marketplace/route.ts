/** GET/POST /api/commerce-platform/marketplace — Marketplace integration references */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMarketplaceSales, recordMarketplaceSale, listMarketplaceOwnership, recordMarketplaceOwnership, verifyMarketplaceOwnership } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId") ?? undefined;
  const buyerId = searchParams.get("buyerId") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  return NextResponse.json({
    sales: listMarketplaceSales(sellerId, buyerId),
    ownership: listMarketplaceOwnership(userId),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.kind === "ownership") {
    const ref = recordMarketplaceOwnership(body);
    return NextResponse.json({ ownership: ref }, { status: 201 });
  }
  const sale = recordMarketplaceSale(body);
  return NextResponse.json({ sale }, { status: 201 });
});

/** PUT /api/commerce-platform/marketplace — Verify ownership */
export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const result = verifyMarketplaceOwnership(body.userId, body.listingId);
  return NextResponse.json(result);
});
