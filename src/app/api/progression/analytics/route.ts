/** GET /api/progression/analytics — Player progress analytics (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateProgressAnalytics } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  const analytics = generateProgressAnalytics(userId);
  if (!analytics) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Profile not found" } }, { status: 404 });
  }
  return NextResponse.json(analytics);
});
