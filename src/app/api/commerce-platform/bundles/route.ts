/** GET/POST /api/commerce-platform/bundles — Bundle catalog (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createBundle, listBundles, supportsAllBundleTypes } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({ bundles: listBundles(type ?? undefined, status ?? undefined), types: supportsAllBundleTypes() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const bundle = createBundle(body);
  return NextResponse.json({ bundle }, { status: 201 });
});
