/** GET /api/organizations/dashboard — Get dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateOrganizationDashboard } from "@/features/organization-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({ route: "dashboard", data: generateOrganizationDashboard() });
});
