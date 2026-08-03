/** GET/POST/PUT /api/identity/service-accounts — Service accounts */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listServiceAccounts, createServiceAccount, deactivateServiceAccount, addServiceAccountScope, recordServiceAccountUsage } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? undefined;
  const active = searchParams.get("active");
  return NextResponse.json({ serviceAccounts: listServiceAccounts(identityId, active === null ? undefined : active === "true") });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "deactivate") return NextResponse.json({ serviceAccount: deactivateServiceAccount(body.id) });
  if (body.action === "add_scope") return NextResponse.json({ serviceAccount: addServiceAccountScope(body.id, body.scope) });
  if (body.action === "record_usage") return NextResponse.json({ serviceAccount: recordServiceAccountUsage(body.id) });
  const sa = createServiceAccount(body);
  return NextResponse.json({ serviceAccount: sa }, { status: 201 });
});
