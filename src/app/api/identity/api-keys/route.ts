/** GET/POST/PUT /api/identity/api-keys — API credentials */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listApiCredentials, issueApiCredential, revokeApiCredential, rotateApiCredential, recordApiCredentialUsage, supportsAllApiCredentialTypes, supportsAllApiCredentialStatuses } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? undefined;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    credentials: listApiCredentials(identityId, status ?? undefined),
    types: supportsAllApiCredentialTypes(), statuses: supportsAllApiCredentialStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "rotate") return NextResponse.json({ credential: rotateApiCredential(body.id) });
  if (body.action === "record_usage") return NextResponse.json({ credential: recordApiCredentialUsage(body.id, body.ip) });
  const cred = issueApiCredential(body);
  return NextResponse.json({ credential: cred }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ credential: revokeApiCredential(body.id, body.reason) });
});
