/**
 * GET /api/discovery/recommendations
 *
 * Phase 4F.1: Get personalized recommendations.
 *
 * Query params:
 *   strategy=for_you  — for_you | popular | trending | topic_based | continue_learning | marketplace_picks
 *   type=resource     — filter by entity type
 *   topicId=abc123    — for topic_based strategy
 *   limit=10          — number of recommendations
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getRecommendations, type RecommendationStrategy, type DiscoveryEntityType } from "@/features/discovery";
import { z } from "zod";

const schema = z.object({
  strategy: z.enum(["for_you", "popular", "trending", "topic_based", "continue_learning", "marketplace_picks", "history_based"]).default("for_you"),
  type: z.string().optional(),
  topicId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);

  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }

  const recommendations = await getRecommendations({
    userId: ctx.userId,
    locale: ctx.locale,
    strategy: parsed.strategy as RecommendationStrategy,
    entityType: parsed.type as DiscoveryEntityType | undefined,
    topicId: parsed.topicId,
    limit: parsed.limit,
  });

  return NextResponse.json({ recommendations });
});
