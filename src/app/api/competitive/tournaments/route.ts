/** GET /api/competitive/tournaments — Competitive platform tournaments (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listTournaments, getTournament } from "@/features/competitive-platform";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = resolveTargetUserId(ctx, searchParams.get("userId"));
  const tournamentId = searchParams.get('tournamentId'); if (tournamentId) { const t = getTournament(tournamentId); if (!t) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Tournament not found' } }, { status: 404 }); return NextResponse.json(t); } return NextResponse.json({ tournaments: listTournaments() });
});
