/** GET /api/discovery/feed — Personalized home feed */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPersonalizedFeed } from "@/features/discovery";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const feed = await getPersonalizedFeed(ctx.userId || undefined, ctx.locale);
  return NextResponse.json(feed);
});
