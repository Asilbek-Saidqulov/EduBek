/** GET/POST /api/identity/providers — Auth providers */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAuthProviders, registerAuthProvider, setAuthProviderStatus, createAuthSession, refreshAuthSession, revokeAuthSession, supportsAllAuthMethods, supportsAllAuthProviderStatuses } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    providers: listAuthProviders(method ?? undefined, status ?? undefined),
    methods: supportsAllAuthMethods(), statuses: supportsAllAuthProviderStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "set_status") return NextResponse.json({ provider: setAuthProviderStatus(body.id, body.status) });
  if (body.action === "create_session") return NextResponse.json({ authSession: createAuthSession(body) });
  if (body.action === "refresh_session") return NextResponse.json({ authSession: refreshAuthSession(body.id) });
  if (body.action === "revoke_session") return NextResponse.json({ authSession: revokeAuthSession(body.id, body.reason) });
  const provider = registerAuthProvider(body);
  return NextResponse.json({ provider }, { status: 201 });
});
