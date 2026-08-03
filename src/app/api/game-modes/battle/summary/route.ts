/** GET /api/game-modes/battle/summary — Battle Royale tournament summary (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getTournament, getChampionship, getBracket, listDuels, getAdvancementEvents,
  getByes, getWalkovers, getTieResolutions, getReplayTimeline,
} from "@/features/game-modes/battle-royale";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");
  if (!tournamentId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "tournamentId required" } }, { status: 400 });
  }
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Tournament not found" } }, { status: 404 });
  }
  return NextResponse.json({
    tournament: {
      id: tournament.id,
      phase: tournament.phase,
      preset: tournament.preset,
      createdAt: tournament.createdAt,
      startedAt: tournament.startedAt,
      finishedAt: tournament.finishedAt,
    },
    championship: getChampionship(tournamentId),
    bracket: getBracket(tournamentId),
    duels: listDuels(tournamentId),
    advancementEvents: getAdvancementEvents(tournamentId),
    byes: getByes(tournamentId),
    walkovers: getWalkovers(tournamentId),
    tieResolutions: getTieResolutions(tournamentId),
    replayTimeline: getReplayTimeline(tournamentId),
  });
});
