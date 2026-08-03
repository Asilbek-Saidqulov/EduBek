/** GET+POST /api/intelligence-network/patterns — List/discover educational patterns */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPatterns, discoverPattern } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const patterns = await listPatterns({
    type: url.searchParams.get("type") ?? undefined,
    subject: url.searchParams.get("subject") ?? undefined,
    verification: url.searchParams.get("verification") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ patterns, total: patterns.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const pattern = await discoverPattern(body);
  return NextResponse.json(pattern, { status: 201 });
});
