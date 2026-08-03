/** GET /api/ai-observability/anomalies — AI observability anomalies report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateAnomalyReport } from "@/features/ai-observability";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = await generateAnomalyReport();
  return NextResponse.json(report);
});
