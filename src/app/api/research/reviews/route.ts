/** GET+POST /api/research/reviews — List/assign/submit peer reviews */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReviews, assignReview, submitReview } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const reviews = await listReviews({
    entityType: url.searchParams.get("entityType") ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    reviewerId: url.searchParams.get("reviewerId") ?? ctx.userId,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ reviews, total: reviews.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const body = await req.json();
  if (action === "submit") {
    const review = await submitReview(body);
    return NextResponse.json(review);
  }
  const review = await assignReview({ ...body, reviewerId: ctx.userId, reviewerName: ctx.email ?? ctx.userId });
  return NextResponse.json(review, { status: 201 });
});
