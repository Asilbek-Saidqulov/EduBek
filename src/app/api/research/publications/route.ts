/** GET+POST /api/research/publications — List/create publication drafts */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPublications, createPublication, updatePublicationStatus } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const publications = await listPublications({
    projectId: url.searchParams.get("projectId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ publications, total: publications.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "update_status") {
    const body = await req.json();
    const pub = await updatePublicationStatus(body.id, body.status, body.doi, body.publishedUrl);
    return NextResponse.json(pub);
  }
  const body = await req.json();
  const pub = await createPublication(body);
  return NextResponse.json(pub, { status: 201 });
});
