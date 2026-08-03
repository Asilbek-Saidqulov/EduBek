/** GET /api/platform-intelligence/recommendation-learning — Recommendation learning analytics */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getRecommendationLearning } from "@/features/platform-intelligence";
import { z } from "zod";

const schema = z.object({
  sinceDays: z.coerce.number().int().min(1).max(365).default(30),
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
  const { sinceDays } = schema.parse(params);
  const learning = await getRecommendationLearning({ sinceDays });
  return NextResponse.json({ strategies: learning, total: learning.length });
});
