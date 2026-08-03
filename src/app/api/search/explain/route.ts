/** GET /api/search/explain — Get explainable recommendation breakdown for an entity */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getRecommendationExplanation } from "@/features/semantic-search";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { entityType, entityId } = schema.parse(params);

  const explanation = await getRecommendationExplanation(
    ctx.userId,
    entityType,
    entityId,
  );

  return NextResponse.json(explanation);
});
