/**
 * GET /api/ai-observability/experiments — List AI experiments (read-only)
 * POST /api/ai-observability/experiments — Create an AI experiment
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listExperiments, createExperiment, generateExperimentReport } from "@/features/ai-observability";
import type { ExperimentType } from "@/features/ai-observability";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const report = url.searchParams.get("report") === "true";
  if (report) {
    const r = await generateExperimentReport();
    return NextResponse.json(r);
  }
  const status = url.searchParams.get("status") ?? undefined;
  const experiments = await listExperiments(status ?? undefined);
  return NextResponse.json({ experiments });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { name, type, description, variants, successMetric } = body as Record<string, unknown>;
  if (!name || !type) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "name and type are required" } }, { status: 400 });
  }
  const experiment = await createExperiment({
    name: String(name),
    type: type as ExperimentType,
    description: description ? String(description) : undefined,
    variants: Array.isArray(variants) ? variants as never : undefined,
    successMetric: successMetric ? String(successMetric) : undefined,
  });
  return NextResponse.json(experiment, { status: 201 });
});
