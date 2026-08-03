/** GET/POST/PUT /api/identity/sessions — Session platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSessions, createSession, revokeSession, refreshSession, revokeAllSessions, expireStaleSessions, supportsAllSessionStatuses } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? undefined;
  const status = searchParams.get("status") as any;
  return NextResponse.json({ sessions: listSessions(identityId, status ?? undefined), statuses: supportsAllSessionStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "refresh") return NextResponse.json({ session: refreshSession(body.id) });
  if (body.action === "revoke_all") return NextResponse.json({ revoked: revokeAllSessions(body.identityId, body.reason) });
  if (body.action === "expire_stale") return NextResponse.json({ expired: expireStaleSessions() });
  const session = createSession(body);
  return NextResponse.json({ session }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ session: revokeSession(body.id, body.reason) });
});
