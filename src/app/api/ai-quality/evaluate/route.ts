/**
 * POST /api/ai-quality/evaluate — Evaluate an AI output
 *
 * Body:
 *   - benchmarkQuestionId (required)
 *   - provider (required)
 *   - model (required)
 *   - promptId (optional)
 *   - promptVersion (optional)
 *   - aiOutput (required)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { evaluateOutput } from "@/features/ai-quality";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { benchmarkQuestionId, provider, model, promptId, promptVersion, aiOutput } = body as Record<string, unknown>;
  if (!benchmarkQuestionId || !provider || !model || !aiOutput) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "benchmarkQuestionId, provider, model, and aiOutput are required" } }, { status: 400 });
  }
  const result = await evaluateOutput({
    benchmarkQuestionId: String(benchmarkQuestionId),
    provider: String(provider),
    model: String(model),
    promptId: promptId ? String(promptId) : null,
    promptVersion: typeof promptVersion === "number" ? promptVersion : null,
    aiOutput: String(aiOutput),
  });
  return NextResponse.json(result, { status: 201 });
});
