/**
 * GET  /api/peer/recommendations — Get peer recommendations for the current user
 * POST /api/peer/recommendations — Generate fresh peer recommendations
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generatePeerRecommendations, listPeerRecommendations, updatePeerRecommendationStatus } from "@/features/collaboration";
import { z } from "zod";

const postSchema = z.object({
  type: z.enum([
    "study_partner", "mentor", "mentee", "helper",
    "discussion_participant", "project_teammate",
  ]).default("study_partner"),
  limit: z.number().int().min(1).max(50).default(10),
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
  const recs = await listPeerRecommendations({
    userId: ctx.userId,
    type: url.searchParams.get("type") as any ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return NextResponse.json({ recommendations: recs, total: recs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = postSchema.parse(await req.json());
  const recs = await generatePeerRecommendations({
    userId: ctx.userId,
    type: body.type,
    limit: body.limit,
  });
  return NextResponse.json({ recommendations: recs, total: recs.length });
});
