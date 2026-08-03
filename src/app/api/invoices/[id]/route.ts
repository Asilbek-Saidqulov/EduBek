import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getInvoice } from "@/features/invoice";

/** GET /api/invoices/[id] — fetch a single invoice (owner or admin only). */
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const authCtx = await getAuthContext();
  const invoice = await getInvoice(authCtx, id);
  return NextResponse.json(invoice);
});
