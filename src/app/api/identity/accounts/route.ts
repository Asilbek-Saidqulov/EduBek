/** GET/POST/PUT /api/identity/accounts — Identity registry + lifecycle */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listIdentities, createIdentity, activateIdentity, verifyIdentity, suspendIdentity, deactivateIdentity, softDeleteIdentity, recoverIdentity, migrateIdentity, supportsAllIdentityTypes, supportsAllIdentityStatuses } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    identities: listIdentities(type ?? undefined, status ?? undefined),
    types: supportsAllIdentityTypes(), statuses: supportsAllIdentityStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const identity = createIdentity(body);
  return NextResponse.json({ identity }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let identity = null;
  if (body.action === "activate") identity = activateIdentity(body.id, ctx.userId);
  else if (body.action === "verify") identity = verifyIdentity(body.id, ctx.userId);
  else if (body.action === "suspend") identity = suspendIdentity(body.id, ctx.userId, body.reason);
  else if (body.action === "deactivate") identity = deactivateIdentity(body.id, ctx.userId, body.reason);
  else if (body.action === "soft_delete") identity = softDeleteIdentity(body.id, ctx.userId, body.reason);
  else if (body.action === "recover") identity = recoverIdentity(body.id, ctx.userId);
  else if (body.action === "migrate") identity = migrateIdentity(body.id, ctx.userId, body.reason);
  return NextResponse.json({ identity });
});
