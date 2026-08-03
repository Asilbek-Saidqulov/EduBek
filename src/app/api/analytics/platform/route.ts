import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlatformAnalytics } from "@/features/analytics";

/** GET /api/analytics/platform — whole-platform KPIs (admin only). */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const analytics = await getPlatformAnalytics(ctx);
  return NextResponse.json(analytics);
});
