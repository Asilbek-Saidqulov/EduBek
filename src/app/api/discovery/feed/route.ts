/** GET /api/discovery/feed — Personalized home feed */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPersonalizedFeed } from "@/features/semantic-search";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }

  const feed = await getPersonalizedFeed(ctx.userId, ctx.locale);
  return NextResponse.json(feed);
});
