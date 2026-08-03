/** GET /api/dashboard/organization — Aggregated organization dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import { computeOrganizationInsight } from "@/features/collaboration";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  // Determine which organization(s) the user belongs to
  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId");

  let targetOrgId: string | null = orgId ?? null;
  if (!targetOrgId) {
    const membership = await db.organizationMembership.findFirst({
      where: { userId: ctx.userId, status: "active" },
      select: { orgId: true },
    });
    targetOrgId = membership?.orgId ?? null;
  }
  if (!targetOrgId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User is not a member of any organization" } },
      { status: 404 },
    );
  }

  const insight = await computeOrganizationInsight(targetOrgId).catch(() => null);
  if (!insight) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Organization insights not available" } },
      { status: 404 },
    );
  }
  return NextResponse.json(insight);
});
