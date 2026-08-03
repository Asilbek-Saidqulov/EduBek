/** GET /api/reliability/disaster — Disaster recovery plan (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateDisasterRecoveryPlan } from "@/features/production/reliability";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const plan = await generateDisasterRecoveryPlan();
  return NextResponse.json(plan);
});
