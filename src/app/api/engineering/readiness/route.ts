/** GET /api/engineering/readiness — Engineering readiness dashboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateReadinessDashboard } from "@/features/production/build-optimizer";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const dashboard = await generateReadinessDashboard();
  return NextResponse.json(dashboard);
});
