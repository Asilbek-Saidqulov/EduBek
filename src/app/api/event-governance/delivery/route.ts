/** GET /api/event-governance/delivery — Event governance delivery (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAllRules, getDeliveryStats } from "@/features/event-governance-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  return NextResponse.json({ rules: getAllRules(), stats: getDeliveryStats() });
});
