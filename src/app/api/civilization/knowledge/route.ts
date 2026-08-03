/** GET+POST /api/civilization/knowledge — List/create knowledge base entries */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listKnowledgeEntries, createKnowledgeEntry, searchKnowledge } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (q) {
    const results = await searchKnowledge(q, Number(url.searchParams.get("limit") ?? 20));
    return NextResponse.json({ results, total: results.length });
  }
  const entries = await listKnowledgeEntries({ organizationId: url.searchParams.get("organizationId") ?? undefined, type: url.searchParams.get("type") ?? undefined, subject: url.searchParams.get("subject") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 100) });
  return NextResponse.json({ entries, total: entries.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const entry = await createKnowledgeEntry({ ...body, authorId: ctx.userId, authorName: ctx.email ?? ctx.userId });
  return NextResponse.json(entry, { status: 201 });
});
