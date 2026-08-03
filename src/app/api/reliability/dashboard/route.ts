/** GET /api/reliability/dashboard — Reliability dashboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateReliabilityDashboard } from "@/features/production/reliability";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const dashboard = await generateReliabilityDashboard();
  return NextResponse.json(dashboard);
});
