/** GET/POST /api/commerce-platform/offers — Offer catalog (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createOffer, listOffers, supportsAllOfferTypes, supportsAllOfferStatuses } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  return NextResponse.json({ offers: listOffers(status ?? undefined, type ?? undefined), types: supportsAllOfferTypes(), statuses: supportsAllOfferStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const offer = createOffer({ ...body, createdBy: ctx.userId });
  return NextResponse.json({ offer }, { status: 201 });
});
