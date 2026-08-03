/**
 * GET /api/product/intent — List known intents
 * POST /api/product/intent — Detect intent from a natural-language query
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { detectIntent, listIntents, getRecentIntents } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const recent = url.searchParams.get("recent") === "true";
  if (recent) {
    const intents = await getRecentIntents(ctx.userId);
    return NextResponse.json({ intents });
  }
  return NextResponse.json({ intents: listIntents() });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? "");
  if (!query) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "query is required" } }, { status: 400 });
  }
  const intent = await detectIntent({ userId: ctx.userId, query });
  return NextResponse.json(intent);
});
