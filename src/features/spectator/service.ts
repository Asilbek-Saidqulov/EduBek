/**
 * EduBek — Live Quiz Spectator service.
 *
 * Spectators are tracked via short-lived tokens (stateless JWT-like
 * tokens signed with the Quiz Session id). The token is required to
 * join the `/spectator` Socket.IO namespace for the Quiz Session room.
 *
 * For private Quiz Sessions, only the host can mint spectator tokens.
 * For classroom/org/public Quiz Sessions, any authorized user can mint
 * their own token.
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  isOrgMember,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { db } from "@/lib/db";
import * as liveSessionRepo from "@/features/live-session/repository";
import * as leaderboardRepo from "@/features/leaderboard/repository";
import type { SpectatorSessionView, SpectatorTokenDto } from "./types";
import type { CreateSpectatorTokenBody } from "./schema";
import { env } from "@/config/env";

const log = getLogger("spectator-service");

// ---------------------------------------------------------------------------
// Token minting (HMAC-based, stateless)
// ---------------------------------------------------------------------------

async function signToken(payload: string): Promise<string> {
  const crypto = await import("node:crypto");
  const secret = env.auth.sessionSecret;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return hmac;
}

async function createSpectatorToken(sessionId: string, userId: string, expiresInSec: number): Promise<SpectatorTokenDto> {
  const expiresAt = Date.now() + expiresInSec * 1000;
  const payload = `${sessionId}:${userId}:${expiresAt}`;
  const signature = await signToken(payload);
  // Token format: base64(payload).signature
  const token = `${Buffer.from(payload).toString("base64")}.${signature}`;
  return {
    token,
    sessionId,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// mintToken
// ---------------------------------------------------------------------------

export async function mintToken(
  ctx: AuthContext,
  input: CreateSpectatorTokenBody,
): Promise<SpectatorTokenDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_SPECTATE)) {
    throw forbidden("No permission to spectate");
  }
  const session = await liveSessionRepo.findSessionById(input.sessionId);
  if (!session) throw notFound("Session not found");

  // Visibility-based access
  if (session.visibility === "private") {
    // Only host / co-hosts can mint spectator tokens for private sessions
    const coHosts: string[] = JSON.parse(session.coHostIds);
    if (session.hostId !== ctx.userId && !coHosts.includes(ctx.userId) && !ctx.isSuperadmin) {
      throw forbidden("Only the host can mint spectator tokens for private sessions");
    }
  } else if (session.visibility === "classroom" && session.classroomId) {
    const membership = await db.classroomStudent.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: session.classroomId,
          studentId: ctx.userId,
        },
      },
    });
    if (!membership && session.hostId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only classroom members can spectate this session");
    }
  } else if (session.visibility === "org" && session.orgId) {
    if (!isOrgMember(ctx, session.orgId) && session.hostId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only org members can spectate this session");
    }
  }
  // public = anyone

  return createSpectatorToken(session.id, ctx.userId, input.expiresIn);
}

// ---------------------------------------------------------------------------
// verifyToken (called by the socket layer)
// ---------------------------------------------------------------------------

export async function verifyToken(token: string): Promise<{ sessionId: string; userId: string; valid: boolean }> {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return { sessionId: "", userId: "", valid: false };
  }
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64").toString("utf-8");
  } catch {
    return { sessionId: "", userId: "", valid: false };
  }
  const expectedSig = await signToken(payload);
  if (signature !== expectedSig) {
    return { sessionId: "", userId: "", valid: false };
  }
  const [sessionId, userId, expiresAtStr] = payload.split(":");
  if (!sessionId || !userId || !expiresAtStr) {
    return { sessionId: "", userId: "", valid: false };
  }
  const expiresAt = parseInt(expiresAtStr, 10);
  if (Date.now() > expiresAt) {
    return { sessionId: "", userId: "", valid: false };
  }
  return { sessionId, userId, valid: true };
}

// ---------------------------------------------------------------------------
// getSessionView (read-only snapshot for spectators)
// ---------------------------------------------------------------------------

export async function getSessionView(
  ctx: AuthContext,
  sessionId: string,
): Promise<SpectatorSessionView> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_SPECTATE)) {
    throw forbidden("No permission to spectate");
  }
  const session = await liveSessionRepo.findSessionById(sessionId);
  if (!session) throw notFound("Session not found");

  // Same visibility check as mintToken
  if (session.visibility === "private") {
    const coHosts: string[] = JSON.parse(session.coHostIds);
    if (session.hostId !== ctx.userId && !coHosts.includes(ctx.userId) && !ctx.isSuperadmin) {
      throw forbidden("Only invited spectators can view this session");
    }
  } else if (session.visibility === "classroom" && session.classroomId) {
    const membership = await db.classroomStudent.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: session.classroomId,
          studentId: ctx.userId,
        },
      },
    });
    if (!membership && session.hostId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only classroom members can spectate");
    }
  } else if (session.visibility === "org" && session.orgId) {
    if (!isOrgMember(ctx, session.orgId) && session.hostId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only org members can spectate");
    }
  }

  const players = await liveSessionRepo.findActivePlayersBySession(sessionId);
  const latestLeaderboard = await leaderboardRepo.findLatest(sessionId);
  let leaderboard: any[] = [];
  if (latestLeaderboard) {
    try { leaderboard = JSON.parse(latestLeaderboard.entries); } catch {}
  } else {
    // Fallback to player records
    leaderboard = players.map((p: any, i: number) => ({
      playerId: p.id,
      displayName: p.displayName,
      score: p.score,
      rank: i + 1,
      accuracy: p.accuracy,
      streak: p.currentStreak,
    }));
  }

  return {
    session: {
      id: session.id,
      title: session.title,
      gameMode: session.gameMode,
      status: session.status,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
    },
    leaderboard: leaderboard.map((e: any) => ({
      playerId: e.playerId,
      displayName: e.displayName,
      score: e.score,
      rank: e.rank,
      accuracy: e.accuracy,
      streak: e.streak ?? 0,
    })),
    playerCount: players.length,
    spectatorCount: 0, // Tracked at the socket layer
  };
}
