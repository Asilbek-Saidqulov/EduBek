/** GET/POST/PUT /api/identity/rbac — Role assignments */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRoleAssignments, assignRole, revokeRoleAssignment, getIdentityPermissions, identityHasPermission, identityHasRole } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? undefined;
  const scope = searchParams.get("scope") as any;
  return NextResponse.json({ assignments: listRoleAssignments(identityId, scope ?? undefined) });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "get_permissions") return NextResponse.json({ permissions: getIdentityPermissions(body.identityId) });
  if (body.action === "has_permission") return NextResponse.json({ has: identityHasPermission(body.identityId, body.permissionKey) });
  if (body.action === "has_role") return NextResponse.json({ has: identityHasRole(body.identityId, body.roleKey) });
  const assignment = assignRole({ ...body, assignedBy: ctx.userId });
  return NextResponse.json({ assignment }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ assignment: revokeRoleAssignment(body.id, body.reason) });
});
