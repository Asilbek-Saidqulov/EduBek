/**
 * GET /api/cognitive/plan — List plans + plan templates
 * POST /api/cognitive/plan — Generate a plan from a template or objective
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPlans, listPlanTemplates, generatePlanFromTemplate, pickPlanTemplate, createPlan } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const [plans, templates] = await Promise.all([
    listPlans(20),
    Promise.resolve(listPlanTemplates()),
  ]);
  return NextResponse.json({ plans, templates });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { templateId, objective } = body as Record<string, unknown>;
  if (templateId && typeof templateId === "string") {
    const plan = await generatePlanFromTemplate(templateId, ctx.userId);
    if (!plan) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
    }
    return NextResponse.json(plan, { status: 201 });
  }
  if (objective && typeof objective === "string") {
    // Pick a template based on the objective
    const pickedTemplateId = pickPlanTemplate(objective);
    if (pickedTemplateId) {
      const plan = await generatePlanFromTemplate(pickedTemplateId, ctx.userId);
      return NextResponse.json(plan, { status: 201 });
    }
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Could not determine a plan template for this objective" } }, { status: 400 });
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Either templateId or objective is required" } }, { status: 400 });
});
