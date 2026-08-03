/** GET/POST /api/commerce-platform/providers — Payment providers (read + register) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listProviders, registerProvider, isProviderAvailable, supportsAllPaymentProviders, supportsAllProviderStatuses } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  return NextResponse.json({ providers: listProviders(status ?? undefined), providerIds: supportsAllPaymentProviders(), statuses: supportsAllProviderStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const provider = registerProvider(body);
  return NextResponse.json({ provider }, { status: 201 });
});

/** PUT /api/commerce-platform/providers — Check provider availability */
export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const available = isProviderAvailable(body.providerId, body.amount, body.currency);
  return NextResponse.json({ available });
});
