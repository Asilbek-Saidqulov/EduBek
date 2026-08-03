/**
 * GET /api/orchestrator/workflows — List workflow definitions and recent executions.
 *
 * Query params:
 *   - enabledOnly (boolean)
 *   - tag (string)
 *   - module (string)
 *   - executions (boolean — include recent executions)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWorkflows, workflowStats, listExecutions } from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const enabledOnly = url.searchParams.get("enabledOnly") === "true";
  const tag = url.searchParams.get("tag") ?? undefined;
  const moduleFilter = url.searchParams.get("module") ?? undefined;
  const includeExecutions = url.searchParams.get("executions") === "true";

  const workflows = listWorkflows({ enabledOnly, tag, module: moduleFilter });
  const stats = workflowStats();
  const executions = includeExecutions ? await listExecutions(20) : [];

  return NextResponse.json({
    workflows,
    stats,
    executions,
  });
});
