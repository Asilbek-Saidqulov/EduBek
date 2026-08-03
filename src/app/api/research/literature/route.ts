/** GET+POST /api/research/literature — List/add literature; GET ?q= — Search */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listLiterature, addLiterature, searchLiteratureEntries } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (q) {
    const results = await searchLiteratureEntries(q, Number(url.searchParams.get("limit") ?? 20));
    return NextResponse.json({ results, total: results.length });
  }
  const entries = await listLiterature({
    type: url.searchParams.get("type") ?? undefined,
    year: url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ literature: entries, total: entries.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const entry = await addLiterature(body);
  return NextResponse.json(entry, { status: 201 });
});
