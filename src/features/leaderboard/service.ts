/**
 * EduBek — Live Quiz Leaderboard service.
 *
 * Two responsibilities:
 *   1. Persist leaderboard snapshots after each round (called by the
 *      Quiz Session service).
 *   2. Read-side: getLatest, getHistory (called by the API + socket layer).
 *
 * The actual leaderboard computation lives in the Game Mode strategy —
 * this service just persists + serves the snapshots.
 */
import { getLogger } from "@/lib/logger";
import { notFound, unauthorized } from "@/lib/errors";
import { type AuthContext } from "@/features/rbac";
import * as repo from "./repository";
import type {
  LeaderboardEntryDto,
  LeaderboardSnapshotDto,
  SaveLeaderboardInput,
} from "./types";
import type { LeaderboardEntry } from "@/features/game-mode";

const log = getLogger("leaderboard-service");

function mapEntry(e: any): LeaderboardEntryDto {
  return {
    playerId: e.playerId,
    userId: e.userId,
    displayName: e.displayName,
    score: e.score,
    rank: e.rank,
    accuracy: e.accuracy,
    avgResponseMs: e.avgResponseMs,
    streak: e.streak,
    modeDisplay: e.modeDisplay,
    rankChange: e.rankChange,
    eliminated: e.eliminated,
  };
}

function mapSnapshot(s: any): LeaderboardSnapshotDto {
  let entries: LeaderboardEntryDto[] = [];
  try { entries = JSON.parse(s.entries); } catch {}
  return {
    id: s.id,
    sessionId: s.sessionId,
    roundNumber: s.roundNumber,
    entries,
    generatedAt: s.generatedAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

export async function saveLeaderboardSnapshot(
  input: SaveLeaderboardInput,
): Promise<LeaderboardSnapshotDto> {
  const snapshot = await repo.saveSnapshot({
    sessionId: input.sessionId,
    roundNumber: input.roundNumber,
    entries: JSON.stringify(input.entries),
  });
  log.info("leaderboard.saved", {
    sessionId: input.sessionId,
    roundNumber: input.roundNumber,
    entryCount: input.entries.length,
  });
  return mapSnapshot(snapshot);
}

export async function getLatestLeaderboard(
  sessionId: string,
): Promise<LeaderboardEntry[] | null> {
  const snapshot = await repo.findLatest(sessionId);
  if (!snapshot) return null;
  try {
    return JSON.parse(snapshot.entries) as LeaderboardEntry[];
  } catch {
    return null;
  }
}

export async function getLatestSnapshot(
  ctx: AuthContext,
  sessionId: string,
): Promise<LeaderboardSnapshotDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const snapshot = await repo.findLatest(sessionId);
  if (!snapshot) throw notFound("No leaderboard yet for this session");
  return mapSnapshot(snapshot);
}

export async function getHistory(
  ctx: AuthContext,
  sessionId: string,
): Promise<LeaderboardSnapshotDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const history = await repo.findHistory(sessionId);
  return history.map(mapSnapshot);
}

export async function getByRound(
  ctx: AuthContext,
  sessionId: string,
  roundNumber: number,
): Promise<LeaderboardSnapshotDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const snapshot = await repo.findBySessionAndRound(sessionId, roundNumber);
  if (!snapshot) throw notFound(`No leaderboard for round ${roundNumber}`);
  return mapSnapshot(snapshot);
}
