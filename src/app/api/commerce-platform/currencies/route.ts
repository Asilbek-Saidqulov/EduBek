/** GET/POST /api/commerce-platform/currencies — Virtual currency catalog (read + create) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createCurrency, listCurrencies, supportsAllCurrencyTypes, supportsAllCurrencyTransactionTypes } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const active = searchParams.get("active");
  return NextResponse.json({ currencies: listCurrencies(type ?? undefined, active === null ? undefined : active === "true"), types: supportsAllCurrencyTypes(), transactionTypes: supportsAllCurrencyTransactionTypes() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const currency = createCurrency(body);
  return NextResponse.json({ currency }, { status: 201 });
});
