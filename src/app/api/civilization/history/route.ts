/** GET+POST /api/civilization/history — List/record institutional memories */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMemories, recordMemory, searchMemory } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId")!;
  const q = url.searchParams.get("q");
  if (q) {
    const results = await searchMemory(orgId, q, Number(url.searchParams.get("limit") ?? 20));
    return NextResponse.json({ results, total: results.length });
  }
  const memories = await listMemories({ organizationId: orgId, type: url.searchParams.get("type") ?? undefined, period: url.searchParams.get("period") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 100) });
  return NextResponse.json({ memories, total: memories.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const memory = await recordMemory(body);
  return NextResponse.json(memory, { status: 201 });
});
