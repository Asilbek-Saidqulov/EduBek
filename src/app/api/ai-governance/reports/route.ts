/** GET /api/ai-governance/reports — Generate a governance report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateReport } from "@/features/ai-governance";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "executive_summary";
  const report = await generateReport(type as never);
  return NextResponse.json(report);
});
