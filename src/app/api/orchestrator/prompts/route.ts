/**
 * GET /api/orchestrator/prompts — List all prompts in the registry.
 * POST /api/orchestrator/prompts — Create a new prompt version.
 *
 * Query params (GET):
 *   - module (string — filter by module)
 *   - activeOnly (boolean)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listPrompts, createPromptVersion, promptRegistryStats,
} from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const moduleFilter = url.searchParams.get("module") ?? undefined;
  const activeOnly = url.searchParams.get("activeOnly") === "true";

  const [prompts, stats] = await Promise.all([
    listPrompts({ module: moduleFilter, activeOnly }),
    promptRegistryStats(),
  ]);
  return NextResponse.json({ prompts, stats });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    promptId, name, description, module, template,
    variables, providerOverride, modelOverride, localizations,
    experimentId, notes,
  } = body as Record<string, unknown>;
  if (!promptId || !name || !module || !template) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "promptId, name, module, and template are required" } }, { status: 400 });
  }
  const prompt = await createPromptVersion({
    promptId: String(promptId),
    name: String(name),
    description: String(description ?? ""),
    module: String(module),
    template: String(template),
    variables: Array.isArray(variables) ? variables as never : [],
    providerOverride: providerOverride ? String(providerOverride) : undefined,
    modelOverride: modelOverride ? String(modelOverride) : undefined,
    localizations: Array.isArray(localizations) ? localizations as never : [],
    experimentId: experimentId ? String(experimentId) : undefined,
    notes: notes ? String(notes) : undefined,
    createdBy: ctx.userId,
  });
  return NextResponse.json(prompt, { status: 201 });
});
