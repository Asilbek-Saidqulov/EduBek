/** GET+POST /api/intelligence-network/evolution — List/record knowledge evolution */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listEvolutions, recordEvolution } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const evolutions = await listEvolutions({
    type: url.searchParams.get("type") ?? undefined,
    entity: url.searchParams.get("entity") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ evolutions, total: evolutions.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const evolution = await recordEvolution(body);
  return NextResponse.json(evolution, { status: 201 });
});
