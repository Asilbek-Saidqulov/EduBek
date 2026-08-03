import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listInvoices } from "@/features/invoice";

/**
 * GET /api/invoices — list the caller's invoices.
 * Supports ?limit and ?offset query parameters.
 */
export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "20")),
  );
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0"));
  const result = await listInvoices(ctx, limit, offset);
  return NextResponse.json(result);
});
