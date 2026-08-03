/** GET/POST /api/identity/permissions — Permission registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPermissions, registerPermission, deactivatePermission, resolveImpliedPermissions, hasPermissionKey } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const ns = searchParams.get("namespace") ?? undefined;
  const active = searchParams.get("active");
  return NextResponse.json({ permissions: listPermissions(ns, active === null ? undefined : active === "true") });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "deactivate") return NextResponse.json({ permission: deactivatePermission(body.id) });
  if (body.action === "resolve") return NextResponse.json({ keys: resolveImpliedPermissions(body.key) });
  if (body.action === "has_key") return NextResponse.json({ has: hasPermissionKey(body.granted, body.required) });
  const perm = registerPermission(body);
  return NextResponse.json({ permission: perm }, { status: 201 });
});
