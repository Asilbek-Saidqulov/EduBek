/** GET /api/broadcast/dashboard — Broadcast dashboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateProductionDashboard } from "@/features/broadcast-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId'); if (!matchId) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'matchId required' } }, { status: 400 }); return NextResponse.json(generateProductionDashboard(matchId));
});
