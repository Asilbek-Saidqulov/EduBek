/** GET /api/competitive/championships — Competitive platform championships (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listChampionships, getChampionship } from "@/features/competitive-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  const championshipId = searchParams.get('championshipId'); if (championshipId) { const c = getChampionship(championshipId); if (!c) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Championship not found' } }, { status: 404 }); return NextResponse.json(c); } return NextResponse.json({ championships: listChampionships() });
});
