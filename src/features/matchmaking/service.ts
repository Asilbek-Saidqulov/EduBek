/**
 * EduBek — Live Quiz Matchmaking service.
 *
 * Each strategy is a small function that returns a `MatchResult`. The
 * service dispatches to the right strategy; the engine doesn't care
 * which one ran.
 *
 * Strategies:
 *   • random     — pick the first open public Lobby (any Game Mode)
 *   • tournament — verify the tournament is in registration phase and
 *                  return its host Quiz Session's PIN (the actual
 *                  bracket runs separately)
 *   • classroom  — find the participant's classroom teacher's open
 *                  Quiz Session (Join Classroom workflow)
 *   • org        — find any open Quiz Session in the participant's org
 *   • invitation — verify the invite token (a Quiz Session PIN) and
 *                  return it
 *   • private    — same as invitation, but the Quiz Session must be
 *                  marked private (no public listing)
 *   • public     — list all open public Lobbies and let the client pick
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
import * as lobbyService from "@/features/lobby/service";
import type { MatchResult, MatchmakingRequest } from "./types";
import type { MatchmakingBody } from "./schema";

const log = getLogger("matchmaking-service");

// ---------------------------------------------------------------------------
// Strategy: random
// ---------------------------------------------------------------------------

async function matchRandom(req: MatchmakingRequest): Promise<MatchResult> {
  const lobbies = await db.lobby.findMany({
    where: { status: "open", visibility: "public", locked: false },
    include: { session: { select: { gameMode: true, status: true, maxPlayers: true } } },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  const eligible = lobbies.filter((l: any) => {
    if (l.session.status !== "lobby") return false;
    if (req.gameMode && l.session.gameMode !== req.gameMode) return false;
    return true;
  });
  if (eligible.length === 0) {
    return { matched: false, reason: "no_open_public_lobbies" };
  }
  const pick = eligible[Math.floor(Math.random() * eligible.length)]!;
  return { matched: true, sessionId: pick.sessionId, joinCode: pick.joinCode };
}

// ---------------------------------------------------------------------------
// Strategy: tournament
// ---------------------------------------------------------------------------

async function matchTournament(ctx: AuthContext, req: MatchmakingRequest): Promise<MatchResult> {
  if (!req.tournamentId) throw badRequest("tournamentId required for tournament matchmaking");
  const tournament = await db.tournament.findUnique({
    where: { id: req.tournamentId },
  });
  if (!tournament) throw notFound("Tournament not found");
  if (tournament.status !== "registration" && tournament.status !== "in_progress") {
    return { matched: false, reason: `tournament_${tournament.status}` };
  }
  // Register the player
  const participants: string[] = JSON.parse(tournament.participants);
  if (!participants.includes(ctx.userId!)) {
    participants.push(ctx.userId!);
    await db.tournament.update({
      where: { id: tournament.id },
      data: { participants: JSON.stringify(participants) },
    });
  }
  return {
    matched: true,
    sessionId: undefined,
    reason: `registered_for_tournament:${tournament.name}`,
  };
}

// ---------------------------------------------------------------------------
// Strategy: classroom
// ---------------------------------------------------------------------------

async function matchClassroom(ctx: AuthContext, req: MatchmakingRequest): Promise<MatchResult> {
  if (!req.classroomId) throw badRequest("classroomId required for classroom matchmaking");
  // Verify the player is in the classroom
  const membership = await db.classroomStudent.findUnique({
    where: {
      classroomId_studentId: {
        classroomId: req.classroomId,
        studentId: ctx.userId!,
      },
    },
  });
  if (!membership || membership.status !== "active") {
    throw forbidden("You are not a member of this classroom");
  }
  // Find open sessions in the classroom
  const sessions = await db.liveSession.findMany({
    where: {
      classroomId: req.classroomId,
      status: "lobby",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  if (sessions.length === 0) {
    return { matched: false, reason: "no_open_classroom_sessions" };
  }
  const session = sessions[0]!;
  const lobby = await db.lobby.findUnique({ where: { sessionId: session.id } });
  return {
    matched: true,
    sessionId: session.id,
    joinCode: lobby?.joinCode,
  };
}

// ---------------------------------------------------------------------------
// Strategy: org
// ---------------------------------------------------------------------------

async function matchOrg(ctx: AuthContext, req: MatchmakingRequest): Promise<MatchResult> {
  if (!req.orgId) throw badRequest("orgId required for org matchmaking");
  if (!isOrgMember(ctx, req.orgId) && !ctx.isSuperadmin) {
    throw forbidden("You are not a member of this organization");
  }
  const sessions = await db.liveSession.findMany({
    where: {
      orgId: req.orgId,
      status: "lobby",
      visibility: { in: ["org", "public"] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  if (sessions.length === 0) {
    return { matched: false, reason: "no_open_org_sessions" };
  }
  const session = sessions[0]!;
  const lobby = await db.lobby.findUnique({ where: { sessionId: session.id } });
  return {
    matched: true,
    sessionId: session.id,
    joinCode: lobby?.joinCode,
  };
}

// ---------------------------------------------------------------------------
// Strategy: invitation / private
// ---------------------------------------------------------------------------

async function matchInvitation(req: MatchmakingRequest, requirePrivate: boolean): Promise<MatchResult> {
  if (!req.inviteToken) throw badRequest("inviteToken required for invitation matchmaking");
  const lobby = await lobbyService.findLobbyByCode(req.inviteToken.toUpperCase());
  if (!lobby) return { matched: false, reason: "invalid_invite_token" };
  if (requirePrivate && lobby.visibility !== "private") {
    return { matched: false, reason: "not_a_private_lobby" };
  }
  if (lobby.status !== "open" || lobby.locked) {
    return { matched: false, reason: "lobby_closed_or_locked" };
  }
  return {
    matched: true,
    sessionId: lobby.sessionId,
    joinCode: lobby.joinCode,
  };
}

// ---------------------------------------------------------------------------
// Strategy: public (list)
// ---------------------------------------------------------------------------

async function matchPublic(req: MatchmakingRequest): Promise<MatchResult> {
  // Public strategy returns the first match (same as random but deterministic —
  // oldest lobby first).
  const lobbies = await db.lobby.findMany({
    where: { status: "open", visibility: "public", locked: false },
    include: { session: { select: { gameMode: true, status: true } } },
    orderBy: { createdAt: "asc" },
    take: 1,
  });
  if (lobbies.length === 0) {
    return { matched: false, reason: "no_open_public_lobbies" };
  }
  const lobby = lobbies[0]!;
  if (req.gameMode && lobby.session.gameMode !== req.gameMode) {
    return { matched: false, reason: "no_matching_game_mode" };
  }
  return {
    matched: true,
    sessionId: lobby.sessionId,
    joinCode: lobby.joinCode,
  };
}

// ---------------------------------------------------------------------------
// Public API: findMatch
// ---------------------------------------------------------------------------

export async function findMatch(
  ctx: AuthContext,
  input: MatchmakingBody,
): Promise<MatchResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.LIVEQUIZ_JOIN)) {
    throw forbidden("No permission to join live quizzes");
  }
  const req: MatchmakingRequest = {
    strategy: input.strategy,
    gameMode: input.gameMode,
    classroomId: input.classroomId,
    orgId: input.orgId,
    tournamentId: input.tournamentId,
    inviteToken: input.inviteToken,
    maxWaitMs: input.maxWaitMs,
  };
  switch (input.strategy) {
    case "random":
      return matchRandom(req);
    case "tournament":
      return matchTournament(ctx, req);
    case "classroom":
      return matchClassroom(ctx, req);
    case "org":
      return matchOrg(ctx, req);
    case "invitation":
      return matchInvitation(req, false);
    case "private":
      return matchInvitation(req, true);
    case "public":
      return matchPublic(req);
    default:
      throw badRequest(`Unknown matchmaking strategy: ${input.strategy}`);
  }
}
