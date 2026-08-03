/** GET+POST /api/research/citations — List/record citations; POST ?action=validate — Validate citations */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCitations, recordCitation, validateCitations } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const citations = await listCitations({
    sourceType: url.searchParams.get("sourceType") ?? undefined,
    sourceId: url.searchParams.get("sourceId") ?? undefined,
    literatureId: url.searchParams.get("literatureId") ?? undefined,
    validationStatus: url.searchParams.get("validationStatus") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ citations, total: citations.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "validate") {
    const body = await req.json();
    const result = await validateCitations(body.sourceType, body.sourceId);
    return NextResponse.json(result);
  }
  const body = await req.json();
  const citation = await recordCitation(body);
  return NextResponse.json(citation, { status: 201 });
});
