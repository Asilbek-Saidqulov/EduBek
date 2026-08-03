/** GET/POST /api/workflows — Workflow registry + management */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWorkflows, createWorkflow, supportsAllWorkflowCategories, supportsAllRegistryStatuses, getDeveloperIntegration } from "@/features/workflow-automation";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    workflows: listWorkflows(category ?? undefined, status ?? undefined),
    categories: supportsAllWorkflowCategories(), statuses: supportsAllRegistryStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const wf = createWorkflow(body);
  return NextResponse.json({ workflow: wf }, { status: 201 });
});
