/** GET /api/game-intelligence/health — Intelligence health (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCurrentLiveHealth, getAllHealthAlerts } from "@/features/game-intelligence";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  return NextResponse.json({ health: getCurrentLiveHealth(), alerts: getAllHealthAlerts() });
});
