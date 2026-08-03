/**
 * GET /api/cognitive/reflection — List recent reflections
 * POST /api/cognitive/reflection — Manually trigger a reflection on an action
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReflections, reflectOnAction, assessMetaCognition } from "@/features/cognitive-ai";
import type { EvidenceItem } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const meta = url.searchParams.get("meta") === "true";
  const reflections = await listReflections(50);
  if (meta) {
    const assessment = assessMetaCognition(reflections);
    return NextResponse.json({ reflections, metaCognition: assessment });
  }
  return NextResponse.json({ reflections });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { actionType, traceId, evidence, confidence, modulesUsed, llmInvoked, estimatedCost, outcome } = body as Record<string, unknown>;
  if (!actionType || !traceId) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "actionType and traceId are required" } }, { status: 400 });
  }
  const reflection = await reflectOnAction({
    actionType: String(actionType),
    traceId: String(traceId),
    evidence: Array.isArray(evidence) ? evidence as EvidenceItem[] : [],
    confidence: typeof confidence === "number" ? confidence : 0.5,
    modulesUsed: Array.isArray(modulesUsed) ? modulesUsed as string[] : [],
    llmInvoked: llmInvoked === true,
    estimatedCost: typeof estimatedCost === "number" ? estimatedCost : 0,
    outcome: outcome as "success" | "partial" | "failure" | "unknown" | undefined,
  });
  return NextResponse.json(reflection, { status: 201 });
});
