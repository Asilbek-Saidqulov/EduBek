/** GET /api/enterprise-operations/reports — Generate a business report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateBusinessReport } from "@/features/enterprise-operations";
import type { ReportType } from "@/features/enterprise-operations";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "executive") as ReportType;
  const report = await generateBusinessReport(type);
  return NextResponse.json(report);
});
