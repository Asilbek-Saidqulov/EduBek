/** GET+POST /api/civilization/advisor — List/generate advisor recommendations */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAdvisorRecommendations, generateAdvisorRecommendations, acknowledgeRecommendation } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const recs = await listAdvisorRecommendations({ organizationId: url.searchParams.get("organizationId")!, category: url.searchParams.get("category") ?? undefined, status: url.searchParams.get("status") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 50) });
  return NextResponse.json({ recommendations: recs, total: recs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "acknowledge") {
    const body = await req.json();
    const rec = await acknowledgeRecommendation(body.id);
    return NextResponse.json(rec);
  }
  const body = await req.json();
  const recs = await generateAdvisorRecommendations(body);
  return NextResponse.json({ recommendations: recs, total: recs.length }, { status: 201 });
});
