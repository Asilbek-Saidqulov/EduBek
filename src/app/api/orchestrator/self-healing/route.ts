/**
 * GET /api/orchestrator/self-healing — Self-healing report (issues, actions, module health).
 * POST /api/orchestrator/self-healing — Run a detection cycle / approve action / toggle.
 *
 * Body (POST):
 *   - action: "run_cycle" | "set_enabled" | "approve_action"
 *   - enabled: boolean (for "set_enabled")
 *   - actionId: string (for "approve_action")
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  runDetectionCycle, getSelfHealingReport,
  setSelfHealingEnabled, approveHealingAction,
} from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = await getSelfHealingReport();
  return NextResponse.json(report);
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  if (action === "run_cycle") {
    const issues = await runDetectionCycle();
    return NextResponse.json({ issues, count: issues.length });
  }
  if (action === "set_enabled") {
    setSelfHealingEnabled(Boolean(body.enabled));
    return NextResponse.json({ enabled: Boolean(body.enabled) });
  }
  if (action === "approve_action") {
    const actionId = String(body.actionId ?? "");
    const approved = await approveHealingAction(actionId);
    if (!approved) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Action not found or not in 'proposed' state" } }, { status: 404 });
    }
    return NextResponse.json({ approved: true });
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action. Use: run_cycle | set_enabled | approve_action" } }, { status: 400 });
});
