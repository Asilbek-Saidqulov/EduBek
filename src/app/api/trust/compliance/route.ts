/** GET/POST /api/trust/compliance — Compliance platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listComplianceRecords, createComplianceRecord, verifyCompliance, supportsAllComplianceDomains, supportsAllComplianceStatuses } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    records: listComplianceRecords(domain ?? undefined, status ?? undefined),
    domains: supportsAllComplianceDomains(), statuses: supportsAllComplianceStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "verify") return NextResponse.json({ record: verifyCompliance(body.id, ctx.userId, body.status) });
  const record = createComplianceRecord(body);
  return NextResponse.json({ record }, { status: 201 });
});
