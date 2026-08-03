/** GET+POST /api/cloud/scheduler — List / create scheduled workflows; POST ?action=execute — Execute due workflows */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listScheduledWorkflows, createScheduledWorkflow, executeDueWorkflows } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1), description: z.string().optional(),
  scheduleType: z.enum(["nightly", "weekly", "semester", "cron", "delayed", "recurring"]),
  cronExpression: z.string().optional(), workflowType: z.string().min(1),
  workflowParams: z.record(z.string(), z.unknown()).default({}),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const workflows = await listScheduledWorkflows({
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    scheduleType: url.searchParams.get("scheduleType") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ workflows, total: workflows.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "execute") {
    const result = await executeDueWorkflows();
    return NextResponse.json(result);
  }
  const body = schema.parse(await req.json());
  const workflow = await createScheduledWorkflow({ ...body, createdBy: ctx.userId });
  return NextResponse.json(workflow, { status: 201 });
});
