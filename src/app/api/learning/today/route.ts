/** GET /api/learning/today — Daily learning agenda */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getDailyAgenda } from "@/features/learning-planner";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const agenda = await getDailyAgenda(ctx.userId, ctx.locale ?? "en");
  return NextResponse.json(agenda);
});
