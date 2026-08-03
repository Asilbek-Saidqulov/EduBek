/** GET /api/cognitive/analytics — Cognitive analytics report */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCognitiveAnalytics } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = await getCognitiveAnalytics();
  return NextResponse.json(report);
});
