/** GET/POST /api/commerce-platform/refunds — Refund platform (read + request) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRefunds, requestRefund, listRefundPolicies, createRefundPolicy, supportsAllRefundStatuses, supportsAllRefundTypes } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    refunds: listRefunds(status ?? undefined),
    policies: listRefundPolicies(),
    statuses: supportsAllRefundStatuses(),
    types: supportsAllRefundTypes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.kind === "policy") {
    const policy = createRefundPolicy(body);
    return NextResponse.json({ policy }, { status: 201 });
  }
  const refund = requestRefund({ ...body, requestedBy: body.requestedBy ?? ctx.userId });
  return NextResponse.json({ refund }, { status: 201 });
});
