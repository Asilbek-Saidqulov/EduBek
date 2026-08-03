/** GET+POST /api/intelligence-network/insights — List/publish collective insights */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listInsights, publishInsight } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const insights = await listInsights({
    type: url.searchParams.get("type") ?? undefined,
    domain: url.searchParams.get("domain") ?? undefined,
    status: url.searchParams.get("status") ?? "active",
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ insights, total: insights.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const insight = await publishInsight(body);
  return NextResponse.json(insight, { status: 201 });
});
