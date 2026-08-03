/**
 * GET /api/education-os/recommendations — Get top recommendations across all agents
 *
 * Query: ?scopeType=user&scopeId=...&limit=10
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getRecommendations } from "@/features/education-os";
import { z } from "zod";

const schema = z.object({
  scopeType: z.enum(["user", "classroom", "organization", "system"]).default("user"),
  scopeId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
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
  const parsed = schema.parse(params);
  const recommendations = await getRecommendations({
    scopeType: parsed.scopeType,
    scopeId: parsed.scopeId ?? ctx.userId,
    limit: parsed.limit,
    locale: ctx.locale ?? "en",
  });
  return NextResponse.json({ recommendations, total: recommendations.length });
});
