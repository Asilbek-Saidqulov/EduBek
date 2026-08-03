import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCreatorAnalytics } from "@/features/analytics";

/** GET /api/analytics/creator — the caller's own creator analytics. */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const analytics = await getCreatorAnalytics(ctx);
  return NextResponse.json(analytics);
});
