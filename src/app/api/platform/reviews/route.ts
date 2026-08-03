/**
 * GET  /api/platform/reviews — List reviews
 * POST /api/platform/reviews — Create a review
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReviews, reviewExtension } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({
  extensionId: z.string().min(1), rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).optional(), organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const reviews = await listReviews({
    extensionId: url.searchParams.get("extensionId") ?? undefined,
    userId: url.searchParams.get("userId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ reviews, total: reviews.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const review = await reviewExtension({ ...body, userId: ctx.userId });
  return NextResponse.json(review, { status: 201 });
});
