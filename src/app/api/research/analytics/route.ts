/** GET /api/research/analytics — Get/generate research analytics dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getResearchAnalytics } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "organizationId required" } }, { status: 400 });
  const refresh = url.searchParams.get("refresh") === "true";
  const analytics = await getResearchAnalytics(orgId, refresh);
  return NextResponse.json(analytics);
});
