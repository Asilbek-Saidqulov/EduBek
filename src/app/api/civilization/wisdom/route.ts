/** GET+POST /api/civilization/wisdom — List/generate wisdom insights */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWisdomInsights, generateWisdom } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const insights = await listWisdomInsights({ organizationId: url.searchParams.get("organizationId") ?? undefined, type: url.searchParams.get("type") ?? undefined, subject: url.searchParams.get("subject") ?? undefined, status: url.searchParams.get("status") ?? "active", limit: Number(url.searchParams.get("limit") ?? 50) });
  return NextResponse.json({ insights, total: insights.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const insight = await generateWisdom(body);
  return NextResponse.json(insight, { status: 201 });
});
