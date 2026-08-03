/**
 * GET /api/orchestrator/reasoning — List recent AI invocations with reasoning metadata.
 * POST /api/orchestrator/reasoning — Invoke AI through the unified pipeline.
 *
 * Query params (GET):
 *   - limit (number, default 50)
 *
 * Body (POST):
 *   - promptId (string, optional — required if rawPrompt not provided)
 *   - promptVars (object, optional)
 *   - rawPrompt (string, optional — overrides promptId)
 *   - provider (string, optional)
 *   - model (string, optional)
 *   - organizationId (string, optional)
 *   - scope (object, optional)
 *   - skipContext (boolean, optional)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  invokeAI, listAIInvocations,
} from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const invocations = await listAIInvocations(limit);
  return NextResponse.json({ invocations });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    promptId, promptVars, rawPrompt, provider, model,
    organizationId, scope, skipContext,
  } = body as Record<string, unknown>;
  if (!promptId && !rawPrompt) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Either promptId or rawPrompt is required" } }, { status: 400 });
  }
  const result = await invokeAI({
    ctx,
    organizationId: organizationId ? String(organizationId) : null,
    promptId: promptId ? String(promptId) : undefined,
    promptVars: promptVars as Record<string, string | number | undefined> | undefined,
    rawPrompt: rawPrompt ? String(rawPrompt) : undefined,
    provider: provider ? String(provider) : undefined,
    model: model ? String(model) : undefined,
    scope: scope as Parameters<typeof invokeAI>[0]["scope"],
    skipContext: skipContext === true,
  });
  return NextResponse.json(result, { status: 201 });
});
