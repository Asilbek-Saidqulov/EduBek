/**
 * GET  /api/digital-twins/scenarios — List scenario plans
 * POST /api/digital-twins/scenarios — Run a scenario simulation
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listScenarios, runScenario } from "@/features/digital-twins";
import { z } from "zod";

const postSchema = z.object({
  type: z.enum(["make_subject_mandatory", "change_class_size", "remove_quizzes", "ai_credit_forecast", "curriculum_change", "schedule_change"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const scenarios = await listScenarios({
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    createdBy: url.searchParams.get("createdBy") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return NextResponse.json({ scenarios, total: scenarios.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = postSchema.parse(await req.json());
  const scenario = await runScenario({
    ...body,
    createdBy: ctx.userId,
  });
  return NextResponse.json(scenario, { status: 201 });
});
