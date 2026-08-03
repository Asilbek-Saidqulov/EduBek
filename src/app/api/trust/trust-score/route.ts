/** GET/POST /api/trust/trust-score — Trust score platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTrustScoreForTarget, listTrustScores, computeTrustScore, listTrustScoreRules, createTrustScoreRule, supportsAllTrustScoreBands } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  if (targetId) return NextResponse.json({ score: getTrustScoreForTarget(targetId) });
  return NextResponse.json({ scores: listTrustScores(), rules: listTrustScoreRules(), bands: supportsAllTrustScoreBands() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "create_rule") return NextResponse.json({ rule: createTrustScoreRule(body) });
  const score = computeTrustScore(body.targetId, body.signals ?? []);
  return NextResponse.json({ score }, { status: 201 });
});
