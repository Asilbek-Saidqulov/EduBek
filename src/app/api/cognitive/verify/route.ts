/**
 * POST /api/cognitive/verify — Verify an answer before delivery
 *
 * Body:
 *   - answer (required)
 *   - evidence (optional, array)
 *   - organizationId (optional)
 *   - conceptsMentioned (optional, array of concept ids)
 *   - assessmentId (optional)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { verifyAnswer } from "@/features/cognitive-ai";
import type { EvidenceItem } from "@/features/cognitive-ai";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { answer, evidence, organizationId, conceptsMentioned, assessmentId } = body as Record<string, unknown>;
  if (!answer || typeof answer !== "string") {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "answer is required" } }, { status: 400 });
  }
  const result = await verifyAnswer({
    answer,
    evidence: Array.isArray(evidence) ? evidence as EvidenceItem[] : [],
    organizationId: organizationId ? String(organizationId) : null,
    userId: ctx.userId,
    conceptsMentioned: Array.isArray(conceptsMentioned) ? conceptsMentioned as string[] : [],
    assessmentId: assessmentId ? String(assessmentId) : null,
  });
  return NextResponse.json(result);
});
