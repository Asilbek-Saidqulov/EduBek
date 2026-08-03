/**
 * GET /api/organizations/mine
 *
 * List the organizations the authenticated user is an active member of.
 *
 * Auth: required.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth/auth.context";
import { listMyOrganizations } from "@/features/organization/organization.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);
  const organizations = await listMyOrganizations(ctx);
  return NextResponse.json({ organizations });
});
