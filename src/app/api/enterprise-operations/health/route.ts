/** GET /api/enterprise-operations/health — Organization health report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateOrganizationHealth } from "@/features/enterprise-operations";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId") ?? undefined;
  const report = await generateOrganizationHealth(orgId);
  return NextResponse.json(report);
});
