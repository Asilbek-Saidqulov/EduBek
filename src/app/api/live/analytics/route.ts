/**
 * GET /api/live/analytics  — platform-wide live quiz analytics
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlatformAnalytics, analyticsQuerySchema } from "@/features/live-analytics";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = analyticsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const analytics = await getPlatformAnalytics(ctx, query);
  return NextResponse.json(analytics);
});
