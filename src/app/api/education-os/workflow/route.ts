/**
 * GET  /api/education-os/workflow — List workflow executions
 * POST /api/education-os/workflow — Execute a workflow
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  runWorkflow,
  listWorkflowExecutions,
  listAllWorkflowTypes,
  getWorkflowTypeDef,
} from "@/features/education-os";
import { z } from "zod";

const postSchema = z.object({
  type: z.enum([
    "generate_lesson", "create_quiz", "create_homework", "intervention",
    "curriculum_alignment", "student_support", "marketplace_compare", "full_teaching_cycle",
  ]),
  scopeType: z.enum(["user", "classroom", "organization", "system"]),
  scopeId: z.string().min(1),
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
  const listType = url.searchParams.get("listTypes");
  if (listType === "true") {
    const types = listAllWorkflowTypes();
    const defs = types.map((t) => getWorkflowTypeDef(t));
    return NextResponse.json({ types: defs });
  }
  const workflows = await listWorkflowExecutions({
    initiatedBy: ctx.userId,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
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
  const workflow = await runWorkflow({
    type: body.type,
    initiatedBy: ctx.userId,
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    params: body.params,
    locale: body.locale ?? ctx.locale ?? "en",
  });
  return NextResponse.json(workflow, { status: 201 });
});
