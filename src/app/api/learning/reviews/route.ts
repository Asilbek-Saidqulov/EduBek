/**
 * GET  /api/learning/reviews — List due + upcoming reviews (SM-2)
 * POST /api/learning/reviews — Record a review (SM-2 quality 0-5)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listDueReviews,
  listUpcomingReviews,
  recordReview,
  recordReviewAuto,
} from "@/features/learning-planner";
import { z } from "zod";

const postSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  // Either provide explicit quality (0-5) OR auto signals (correct + optional responseMs/retries).
  quality: z.number().int().min(0).max(5).optional(),
  correct: z.boolean().optional(),
  responseMs: z.number().int().min(0).optional(),
  retries: z.number().int().min(0).optional(),
}).refine(
  (v) => v.quality !== undefined || v.correct !== undefined,
  { message: "Either `quality` (0-5) or `correct` (boolean) must be provided" },
);

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "due"; // 'due' | 'upcoming' | 'all'
  const withinDays = Number(url.searchParams.get("withinDays") ?? "7");

  const due = scope === "due" || scope === "all"
    ? await listDueReviews(ctx.userId, 50)
    : [];
  const upcoming = scope === "upcoming" || scope === "all"
    ? await listUpcomingReviews(ctx.userId, withinDays, 50)
    : [];

  return NextResponse.json({
    due,
    upcoming,
    totalDue: due.length,
    totalUpcoming: upcoming.length,
  });
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

  let result;
  if (body.quality !== undefined) {
    result = await recordReview({
      userId: ctx.userId,
      entityType: body.entityType,
      entityId: body.entityId,
      quality: body.quality,
      responseMs: body.responseMs,
    });
  } else {
    result = await recordReviewAuto({
      userId: ctx.userId,
      entityType: body.entityType,
      entityId: body.entityId,
      correct: body.correct!,
      responseMs: body.responseMs,
      retries: body.retries,
    });
  }

  return NextResponse.json(result, { status: 201 });
});
