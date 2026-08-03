/** GET/POST /api/commerce-platform/products — Product catalog (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createProduct, listProducts, supportsAllProductTypes, supportsAllProductStatuses } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  return NextResponse.json({ products: listProducts(status ?? undefined, type ?? undefined), types: supportsAllProductTypes(), statuses: supportsAllProductStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const product = createProduct(body);
  return NextResponse.json({ product }, { status: 201 });
});
