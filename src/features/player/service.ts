/**
 * EduBek — Live Quiz Participant service.
 *
 * Read-side + minor admin overrides. The Quiz Session service handles
 * all gameplay-affecting mutations (join/leave/answer/eliminate).
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { db } from "@/lib/db";
import * as repo from "./repository";
import * as liveSessionRepo from "@/features/live-session/repository";
import type { PlayerDto, PlayerStatsDto, PlayerHistoryDto } from "./types";
import type { ListPlayersQuery, UpdatePlayerBody } from "./schema";

const log = getLogger("player-service");

function mapPlayer(p: any): PlayerDto {
  const safeParse = <T>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  };
  return {
    id: p.id,
    sessionId: p.sessionId,
    userId: p.userId,
    displayName: p.displayName,
    role: p.role,
    status: p.status,
    state: safeParse(p.state, {}),
    score: p.score,
    accuracy: p.accuracy,
    correctCount: p.correctCount,
    wrongCount: p.wrongCount,
    currentStreak: p.currentStreak,
    longestStreak: p.longestStreak,
    avgResponseMs: p.avgResponseMs,
    answeredCount: p.answeredCount,
    finalRank: p.finalRank,
    socketId: p.socketId,
    lastSeenAt: p.lastSeenAt.toISOString(),
    disconnectedAt: p.disconnectedAt ? p.disconnectedAt.toISOString() : null,
    joinedAt: p.joinedAt.toISOString(),
    leftAt: p.leftAt ? p.leftAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getPlayer(
  ctx: AuthContext,
  playerId: string,
): Promise<PlayerDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const player = await repo.findPlayerById(playerId);
  if (!player) throw notFound("Player not found");
  // Caller must be the player OR the session host
  if (player.userId !== ctx.userId && !ctx.isSuperadmin) {
    const session = await liveSessionRepo.findSessionById(player.sessionId);
    if (!session || session.hostId !== ctx.userId) {
      if (!can(ctx, PersonalPermission.LIVEQUIZ_MANAGE)) {
        throw forbidden("You can only view your own player record");
      }
    }
  }
  return mapPlayer(player);
}

export async function listPlayers(
  ctx: AuthContext,
  query: ListPlayersQuery,
): Promise<{ players: PlayerDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_MANAGE) && !ctx.isSuperadmin) {
    throw forbidden("No permission to list players");
  }
  let players: any[];
  if (query.sessionId) {
    players = await repo.findPlayersBySession(query.sessionId);
    if (query.status) {
      players = players.filter((p) => p.status === query.status);
    }
  } else if (query.userId) {
    players = await repo.findPlayersByUser(query.userId);
  } else {
    // Default: limit to sessions the caller hosts
    const sessions = await db.liveSession.findMany({
      where: { hostId: ctx.userId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);
    players = await db.livePlayer.findMany({
      where: { sessionId: { in: sessionIds } },
      orderBy: { joinedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
  }
  return {
    players: players.map(mapPlayer),
    total: players.length,
  };
}

export async function updatePlayer(
  ctx: AuthContext,
  playerId: string,
  input: UpdatePlayerBody,
): Promise<PlayerDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const player = await repo.findPlayerById(playerId);
  if (!player) throw notFound("Player not found");
  // Only the session host (or superadmin) can update a player record.
  const session = await liveSessionRepo.findSessionById(player.sessionId);
  if (!session) throw notFound("Session not found");
  if (session.hostId !== ctx.userId && !ctx.isSuperadmin) {
    if (!(player.userId === ctx.userId && input.displayName && !input.status)) {
      throw forbidden("Only the host can update players");
    }
  }
  const updated = await repo.updatePlayer(playerId, {
    displayName: input.displayName,
    status: input.status,
  });
  log.info("player.updated", { playerId, by: ctx.userId });
  return mapPlayer(updated);
}

export async function getMyStats(ctx: AuthContext): Promise<PlayerStatsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const players = await repo.findPlayerStats(ctx.userId);
  const totalSessions = players.length;
  const totalScore = players.reduce((sum: number, p: any) => sum + (p.score ?? 0), 0);
  const totalAccuracy = players.reduce((sum: number, p: any) => sum + (p.accuracy ?? 0), 0);
  const totalResponseMs = players.reduce((sum: number, p: any) => sum + (p.avgResponseMs ?? 0), 0);
  const bestStreak = players.reduce((max: number, p: any) => Math.max(max, p.longestStreak ?? 0), 0);
  // Wins = rank 1 finishes
  const totalWins = players.filter((p: any) => p.finalRank === 1).length;
  // Favorite game mode = most common among sessions played
  const modeCounts = new Map<string, number>();
  for (const p of players) {
    const mode = (p.session as any)?.gameMode ?? "unknown";
    modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);
  }
  const favoriteGameMode = modeCounts.size > 0
    ? [...modeCounts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
    : null;

  return {
    playerId: "aggregate",
    userId: ctx.userId,
    displayName: players[0]?.displayName ?? "",
    totalSessions,
    totalScore,
    averageScore: totalSessions > 0 ? Math.round(totalScore / totalSessions) : 0,
    averageAccuracy: totalSessions > 0 ? totalAccuracy / totalSessions : 0,
    averageResponseMs: totalSessions > 0 ? Math.round(totalResponseMs / totalSessions) : 0,
    bestStreak,
    totalWins,
    favoriteGameMode,
  };
}

export async function getMyHistory(ctx: AuthContext): Promise<PlayerHistoryDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const players = await repo.findPlayerStats(ctx.userId);
  return {
    playerId: "history",
    sessions: players.map((p: any) => ({
      sessionId: p.sessionId,
      title: p.session?.title ?? "Untitled",
      gameMode: p.session?.gameMode ?? "unknown",
      finalRank: p.finalRank,
      score: p.score ?? 0,
      finishedAt: p.session?.finishedAt ? p.session.finishedAt.toISOString() : null,
    })),
  };
}
