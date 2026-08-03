/** GET /api/game-modes/battle/leaderboard — Battle Royale leaderboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildLeaderboard, getTournament } from "@/features/game-modes/battle-royale";
import type { BattleRoyaleLeaderboardType } from "@/features/game-modes/battle-royale";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");
  const type = (searchParams.get("type") ?? "tournament_ranking") as BattleRoyaleLeaderboardType;
  if (!tournamentId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "tournamentId required" } }, { status: 400 });
  }
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Tournament not found" } }, { status: 404 });
  }
  return NextResponse.json({ leaderboard: buildLeaderboard(tournamentId, type), type });
});
