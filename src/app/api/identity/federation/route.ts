/** GET/POST/PUT /api/identity/federation — Identity federation */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listFederationLinks, linkFederation, revokeFederationLink, syncFederationLink, supportsAllFederationProviders } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? undefined;
  const provider = searchParams.get("provider") as any;
  return NextResponse.json({ links: listFederationLinks(identityId, provider ?? undefined), providers: supportsAllFederationProviders() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "sync") return NextResponse.json({ link: syncFederationLink(body.id) });
  const link = linkFederation(body);
  return NextResponse.json({ link }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ link: revokeFederationLink(body.id, body.reason) });
});
