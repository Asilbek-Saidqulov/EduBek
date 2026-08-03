/** GET /api/progression/prestige — Player prestige info (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPrestigeInfo, getPrestigeConfig } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  return NextResponse.json({
    prestigeInfo: getPrestigeInfo(userId),
    config: getPrestigeConfig(),
  });
});
