/** GET /api/learning/report — Generate the weekly progress report */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateWeeklyReport } from "@/features/learning-planner";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const report = await generateWeeklyReport(ctx.userId, ctx.locale ?? "en");
  return NextResponse.json(report);
});
