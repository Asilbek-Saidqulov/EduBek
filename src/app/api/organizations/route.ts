/**
 * POST /api/organizations
 *
 * Create a new organization. The authenticated user becomes its OWNER and
 * is automatically granted an active membership.
 *
 * Auth: required.
 * Body: see `createOrganizationBodySchema`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { badRequest, withErrorHandler } from "@/lib/errors";
import { createOrganizationBodySchema } from "@/features/organization/organization.schema";
import {
  getAuthContext,
  requireAuth,
  loadOrgPermissions,
} from "@/features/auth/auth.context";
import { createOrganization } from "@/features/organization/organization.service";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);

  const body = await req.json().catch(() => null);
  const parsed = createOrganizationBodySchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid organization payload", {
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  const org = await createOrganization(ctx, parsed.data);
  // Pre-populate org permissions on the context so any in-flight
  // downstream checks within the same request see the new membership.
  await loadOrgPermissions(ctx);
  return NextResponse.json({ organization: org }, { status: 201 });
});
