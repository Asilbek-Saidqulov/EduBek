/** GET/POST /api/trust/reports — Reporting platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReports, submitReport, transitionReport, supportsAllReportTypes, supportsAllReportStatuses, supportsAllReportReasons } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const reason = searchParams.get("reason") as any;
  return NextResponse.json({
    reports: listReports(status ?? undefined, reason ?? undefined),
    types: supportsAllReportTypes(), statuses: supportsAllReportStatuses(), reasons: supportsAllReportReasons(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const report = submitReport({ ...body, reporterId: body.reporterId ?? ctx.userId });
  return NextResponse.json({ report }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ report: transitionReport(body.id, body.to, ctx.userId, body.resolution) });
});
