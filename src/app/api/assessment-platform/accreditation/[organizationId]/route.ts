/** GET /api/assessment-platform/accreditation/:organizationId — Get or generate accreditation report */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAccreditationReport } from "@/features/assessment-platform";

export const GET = withErrorHandler<{ organizationId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { organizationId } = await ctx.params;
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "true";
  const report = await getAccreditationReport(organizationId, refresh);
  return NextResponse.json(report);
});
