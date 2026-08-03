/** GET/POST/PUT /api/identity/organizations — Organization identity */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listOrganizations, createOrganization, submitOrganizationForVerification, verifyOrganization, rejectOrganization, revokeOrganization, supportsAllOrganizationTypes, supportsAllOrganizationVerificationStatuses } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    organizations: listOrganizations(type ?? undefined, status ?? undefined),
    types: supportsAllOrganizationTypes(), statuses: supportsAllOrganizationVerificationStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const org = createOrganization(body);
  return NextResponse.json({ organization: org }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let org = null;
  if (body.action === "submit") org = submitOrganizationForVerification(body.id);
  else if (body.action === "verify") org = verifyOrganization(body.id, ctx.userId);
  else if (body.action === "reject") org = rejectOrganization(body.id, ctx.userId);
  else if (body.action === "revoke") org = revokeOrganization(body.id, ctx.userId);
  return NextResponse.json({ organization: org });
});
