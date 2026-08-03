/** GET /api/telemetry/dashboard — Operational dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateOperationalDashboard } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json(generateOperationalDashboard());
});
