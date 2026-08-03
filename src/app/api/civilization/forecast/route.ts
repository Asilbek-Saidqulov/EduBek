/** GET /api/civilization/forecast — Get forecasts (simulations + wisdom combined) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSimulations, listWisdomInsights } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId")!;
  const [simulations, wisdom] = await Promise.all([
    listSimulations({ organizationId: orgId, limit: 10 }),
    listWisdomInsights({ organizationId: orgId, type: "predictive", limit: 10 }),
  ]);
  return NextResponse.json({ simulations, wisdom, generatedAt: new Date().toISOString() });
});
