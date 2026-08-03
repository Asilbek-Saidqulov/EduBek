/**
 * GET /api/orchestrator/admin — Unified admin console dashboard.
 *
 * Returns the health of every subsystem plus alerts, costs, workers,
 * queues, usage, and KPIs.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAdminDashboard } from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const dashboard = await getAdminDashboard();
  return NextResponse.json(dashboard);
});
