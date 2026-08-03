/** GET/POST /api/identity/roles — Role templates */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRoleTemplates, createRoleTemplate, deactivateRoleTemplate, addRolePermission, resolveRolePermissions, supportsAllRoleScopes } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") as any;
  const active = searchParams.get("active");
  return NextResponse.json({
    roleTemplates: listRoleTemplates(scope ?? undefined, active === null ? undefined : active === "true"),
    scopes: supportsAllRoleScopes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "deactivate") return NextResponse.json({ role: deactivateRoleTemplate(body.id) });
  if (body.action === "add_permission") return NextResponse.json({ role: addRolePermission(body.id, body.permissionKey) });
  if (body.action === "resolve") return NextResponse.json({ permissions: resolveRolePermissions(body.key) });
  const role = createRoleTemplate(body);
  return NextResponse.json({ role }, { status: 201 });
});
