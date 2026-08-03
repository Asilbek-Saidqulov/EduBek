/**
 * GET  /api/digital-twins/workflows — List academic workflows
 * POST /api/digital-twins/workflows — Trigger a workflow
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWorkflows, triggerWorkflow, listWorkflowTriggers } from "@/features/digital-twins";
import { z } from "zod";

const postSchema = z.object({
  trigger: z.enum(["quiz_finished", "lesson_completed", "assignment_submitted", "student_at_risk", "curriculum_gap", "semester_start", "exam_period_start"]),
  scopeType: z.string().optional(),
  scopeId: z.string().optional(),
  triggerEntityId: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  locale: z.string().optional(),
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
  if (url.searchParams.get("listTriggers") === "true") {
    return NextResponse.json({ triggers: listWorkflowTriggers() });
  }
  const workflows = await listWorkflows({
    trigger: url.searchParams.get("trigger") ?? undefined,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ workflows, total: workflows.length });
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
  const workflow = await triggerWorkflow(body);
  return NextResponse.json(workflow, { status: 201 });
});
