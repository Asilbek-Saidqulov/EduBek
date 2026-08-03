/** GET/POST /api/telemetry/diagnostics — Diagnostics engine */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listDiagnosticReports, runDiagnosticReport, supportsAllDiagnosticCheckTypes, supportsAllDiagnosticCheckStatuses } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({
    reports: listDiagnosticReports(),
    checkTypes: supportsAllDiagnosticCheckTypes(), checkStatuses: supportsAllDiagnosticCheckStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const report = runDiagnosticReport(body);
  return NextResponse.json({ report }, { status: 201 });
});
