/**
 * GET /api/ai-governance/privacy — Privacy report (read-only)
 * POST /api/ai-governance/privacy — Evaluate privacy of text
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { evaluatePrivacy } from "@/features/ai-governance";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  return NextResponse.json({ generatedAt: new Date().toISOString(), findings: [], totalCount: 0, criticalCount: 0, privacyScore: 90, recommendations: [] });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { text } = body as Record<string, unknown>;
  if (!text) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "text is required" } }, { status: 400 });
  const report = await evaluatePrivacy({ text: String(text) });
  return NextResponse.json(report);
});
