/** GET+POST /api/intelligence-network/alignments — List/create multilingual alignments */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAlignments, createAlignment } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const alignments = await listAlignments({
    sourceLanguage: url.searchParams.get("sourceLanguage") ?? undefined,
    targetLanguage: url.searchParams.get("targetLanguage") ?? undefined,
    context: url.searchParams.get("context") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ alignments, total: alignments.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const alignment = await createAlignment(body);
  return NextResponse.json(alignment, { status: 201 });
});
