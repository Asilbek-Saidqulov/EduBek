/**
 * GET /api/ai-governance/explainability — Explainability report (read-only)
 * Query: traceId (required)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateExplainabilityReport } from "@/features/ai-governance";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const traceId = url.searchParams.get("traceId");
  if (!traceId) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "traceId is required" } }, { status: 400 });
  const report = await generateExplainabilityReport({ traceId });
  return NextResponse.json(report);
});
