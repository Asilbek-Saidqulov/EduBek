/** GET /api/progression/challenges — Player challenges + catalog (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlayerChallenges, listChallenges, listMonthlyChallenges, listEventChallenges } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  const scope = searchParams.get("scope") ?? undefined;
  return NextResponse.json({
    weekly: listChallenges(scope as never),
    monthly: listMonthlyChallenges(),
    events: listEventChallenges(true),
    enrolled: getPlayerChallenges(userId),
  });
});
