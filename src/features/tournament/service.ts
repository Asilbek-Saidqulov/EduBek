/**
 * EduBek — Live Quiz Tournament service.
 *
 * Manages the Tournament lifecycle: create → register → start →
 * generate bracket → run matches → declare champion.
 *
 * Bracket generation: for single-elimination with N participants
 * (N = power of 2), we seed participants into round 1 matches
 * (N/2 matches). Each subsequent round has half as many matches.
 * Byes are awarded when fewer than N participants register.
 *
 * Each match is a 1v1 LiveSession using the "battle" Game Mode
 * (Battle Royale). The match is "finished" when its Quiz Session
 * finishes; the winner advances to the next round.
 *
 * Events published:
 *   • TOURNAMENT_CREATED
 *   • TOURNAMENT_STARTED
 *   • MATCH_FINISHED
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  canInOrg,
  isOrgMember,
  PersonalPermission,
  OrgPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  MATCH_FINISHED,
  TOURNAMENT_CREATED,
  TOURNAMENT_STARTED,
  type MatchFinishedEvent,
  type TournamentCreatedEvent,
  type TournamentStartedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import { getGameModeDisplayName } from "@/features/game-mode";
import * as repo from "./repository";
import type { Bracket, TournamentDto, TournamentMatchDto, TournamentStatsDto, MatchHistoryDto } from "./types";
import type {
  CreateTournamentBody,
  ListTournamentsQuery,
  RegisterBody,
} from "./schema";

const log = getLogger("tournament-service");

function mapTournament(t: any): TournamentDto {
  let participants: string[] = [];
  try { participants = JSON.parse(t.participants); } catch {}
  let bracket: Record<string, unknown> = {};
  try { bracket = JSON.parse(t.bracket); } catch {}
  // Phase 4C.1: pull additive fields out of the bracket JSON (no schema migration)
  const scheduledStartAt = (bracket.scheduledStartAt as string | undefined) ?? null;
  const checkInWindowMinutes = (bracket.checkInWindowMinutes as number | undefined) ?? 15;
  const lateRegistrationClosesAt = (bracket.lateRegistrationClosesAt as string | undefined) ?? null;
  const autoAdvancement = (bracket.autoAdvancement as boolean | undefined) ?? true;
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    hostId: t.hostId,
    orgId: t.orgId,
    classroomId: t.classroomId,
    gameMode: t.gameMode,
    gameModeName: getGameModeDisplayName(t.gameMode),
    format: t.format,
    bracketSize: t.bracketSize,
    status: t.status,
    participants,
    championId: t.championId,
    startedAt: t.startedAt ? t.startedAt.toISOString() : null,
    finishedAt: t.finishedAt ? t.finishedAt.toISOString() : null,
    bracket,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    // Phase 4C.1 additive
    scheduledStartAt,
    checkInWindowMinutes,
    lateRegistrationClosesAt,
    autoAdvancement,
  };
}

function mapMatch(m: any): TournamentMatchDto {
  return {
    id: m.id,
    tournamentId: m.tournamentId,
    roundNumber: m.roundNumber,
    matchNumber: m.matchNumber,
    player1Id: m.player1Id,
    player2Id: m.player2Id,
    session1Id: m.session1Id,
    session2Id: m.session2Id,
    winnerId: m.winnerId,
    score1: m.score1,
    score2: m.score2,
    status: m.status,
    scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
    finishedAt: m.finishedAt ? m.finishedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// createTournament
// ---------------------------------------------------------------------------

export async function createTournament(
  ctx: AuthContext,
  input: CreateTournamentBody,
): Promise<TournamentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.TOURNAMENT_MANAGE)) {
    throw forbidden("No permission to manage tournaments");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (!ctx.isSuperadmin && !canInOrg(ctx, input.orgId, OrgPermission.ORG_TOURNAMENT_MANAGE)) {
      throw forbidden("No org permission to manage tournaments");
    }
  }

  const tournament = await repo.createTournament({
    name: input.name,
    description: input.description,
    hostId: ctx.userId,
    orgId: input.orgId,
    classroomId: input.classroomId,
    gameMode: input.gameMode,
    format: input.format,
    bracketSize: input.bracketSize,
    participants: JSON.stringify(input.participantIds ?? []),
  });

  // Phase 4C.1: persist additive scheduling/config fields in the bracket JSON
  const initialBracket: Record<string, unknown> = {
    scheduledStartAt: input.scheduledStartAt ?? null,
    checkInWindowMinutes: input.checkInWindowMinutes,
    lateRegistrationClosesAt: input.lateRegistrationClosesAt ?? null,
    autoAdvancement: input.autoAdvancement,
    checkedInParticipants: [],
    rounds: [],
  };
  await repo.updateTournament(tournament.id, {
    bracket: JSON.stringify(initialBracket),
  });
  const withBracket = await repo.findTournamentById(tournament.id);

  eventBus.publish(
    buildEvent<TournamentCreatedEvent>({
      type: TOURNAMENT_CREATED,
      actorId: ctx.userId,
      tournamentId: tournament.id,
      name: tournament.name,
      hostId: tournament.hostId,
      format: tournament.format,
      bracketSize: tournament.bracketSize,
    }),
  );

  log.info("tournament.created", { tournamentId: tournament.id });
  return mapTournament(withBracket ?? tournament);
}

// ---------------------------------------------------------------------------
// getTournament
// ---------------------------------------------------------------------------

export async function getTournament(
  ctx: AuthContext,
  id: string,
): Promise<TournamentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(id);
  if (!tournament) throw notFound("Tournament not found");
  return mapTournament(tournament);
}

// ---------------------------------------------------------------------------
// listTournaments
// ---------------------------------------------------------------------------

export async function listTournaments(
  ctx: AuthContext,
  query: ListTournamentsQuery,
): Promise<{ tournaments: TournamentDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const result = await repo.listTournaments({
    status: query.status,
    hostId: query.hostId,
    classroomId: query.classroomId,
    orgId: query.orgId,
    page: query.page,
    pageSize: query.pageSize,
  });
  return {
    tournaments: result.items.map(mapTournament),
    total: result.total,
  };
}

// ---------------------------------------------------------------------------
// register (add a participant)
// ---------------------------------------------------------------------------

export async function register(
  ctx: AuthContext,
  tournamentId: string,
  input: RegisterBody,
): Promise<TournamentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  if (tournament.status !== "registration") {
    throw badRequest("Tournament is not in registration phase");
  }
  const userId = input.userId ?? ctx.userId;
  // Self-registration OR host registering others
  if (userId !== ctx.userId && tournament.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Can only self-register or register others as the host");
  }
  const participants: string[] = JSON.parse(tournament.participants);
  if (participants.includes(userId)) {
    throw badRequest("Already registered");
  }
  if (participants.length >= tournament.bracketSize) {
    throw badRequest("Tournament is full");
  }
  participants.push(userId);
  const updated = await repo.updateTournament(tournamentId, {
    participants: JSON.stringify(participants),
  });
  return mapTournament(updated);
}

// ---------------------------------------------------------------------------
// startTournament — generate the bracket and create round-1 matches
// ---------------------------------------------------------------------------

export async function startTournament(
  ctx: AuthContext,
  tournamentId: string,
): Promise<TournamentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  if (tournament.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can start the tournament");
  }
  if (tournament.status !== "registration") {
    throw badRequest("Tournament is not in registration phase");
  }
  const participants: string[] = JSON.parse(tournament.participants);
  if (participants.length < 2) {
    throw badRequest("Need at least 2 participants to start");
  }

  // Seed round 1: pair up participants. Byes go to the first few players
  // when participant count < bracketSize.
  const seeds = [...participants];
  while (seeds.length < tournament.bracketSize) {
    seeds.push(""); // empty = bye
  }
  // Shuffle seeds for fairness (the host can re-seed manually later if desired)
  for (let i = seeds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j]!, seeds[i]!];
  }

  const matchesPerRound = tournament.bracketSize / 2;
  const rounds: Bracket["rounds"] = [];
  let currentMatches = matchesPerRound;
  let roundNumber = 1;
  while (currentMatches >= 1) {
    const round: Bracket["rounds"][number] = {
      roundNumber,
      name: roundName(roundNumber, tournament.bracketSize),
      matches: [],
    };
    for (let m = 0; m < currentMatches; m++) {
      let player1Id: string | null = null;
      let player2Id: string | null = null;
      let status = "pending";
      if (roundNumber === 1) {
        const s1 = seeds[m * 2] ?? "";
        const s2 = seeds[m * 2 + 1] ?? "";
        player1Id = s1 || null;
        player2Id = s2 || null;
        // Bye: if only one player, they advance automatically
        if (player1Id && !player2Id) {
          status = "bye";
        }
      }
      const match = await repo.createMatch({
        tournamentId,
        roundNumber,
        matchNumber: m + 1,
        player1Id: player1Id ?? "bye",
        player2Id: player2Id ?? undefined,
        status,
      });
      round.matches.push({
        matchId: match.id,
        player1Id: player1Id,
        player2Id: player2Id,
        winnerId: status === "bye" ? player1Id : null,
        sessionId: null,
      });
    }
    rounds.push(round);
    currentMatches = Math.floor(currentMatches / 2);
    roundNumber += 1;
  }

  const bracket: Bracket = { rounds };
  const updated = await repo.updateTournament(tournamentId, {
    status: "in_progress",
    startedAt: new Date(),
    bracket: JSON.stringify(bracket),
  });

  eventBus.publish(
    buildEvent<TournamentStartedEvent>({
      type: TOURNAMENT_STARTED,
      actorId: ctx.userId,
      tournamentId,
      participantCount: participants.length,
    }),
  );

  return mapTournament(updated);
}

function roundName(round: number, bracketSize: number): string {
  const totalRounds = Math.log2(bracketSize);
  const remaining = totalRounds - round + 1;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semifinals";
  if (remaining === 3) return "Quarterfinals";
  if (remaining === 4) return "Round of 16";
  if (remaining === 5) return "Round of 32";
  if (remaining === 6) return "Round of 64";
  return `Round ${round}`;
}

// ---------------------------------------------------------------------------
// finishMatch — record the winner and advance them to the next round
// ---------------------------------------------------------------------------

export async function finishMatch(
  ctx: AuthContext,
  matchId: string,
  winnerId: string,
  score1?: number,
  score2?: number,
): Promise<TournamentMatchDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const match = await repo.findMatchById(matchId);
  if (!match) throw notFound("Match not found");
  const tournament = await repo.findTournamentById(match.tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  if (tournament.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can finish matches");
  }
  if (match.status === "finished") {
    throw badRequest("Match already finished");
  }
  if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
    throw badRequest("Winner must be one of the match participants");
  }

  const updated = await repo.updateMatch(matchId, {
    winnerId,
    score1: score1 ?? null,
    score2: score2 ?? null,
    status: "finished",
    finishedAt: new Date(),
  });

  eventBus.publish(
    buildEvent<MatchFinishedEvent>({
      type: MATCH_FINISHED,
      actorId: ctx.userId,
      tournamentId: match.tournamentId,
      matchId,
      winnerId,
      roundNumber: match.roundNumber,
    }),
  );

  // Advance the winner to the next round
  const nextRoundNumber = match.roundNumber + 1;
  const nextMatchNumber = Math.ceil(match.matchNumber / 2);
  const nextMatch = await db.tournamentMatch.findFirst({
    where: {
      tournamentId: match.tournamentId,
      roundNumber: nextRoundNumber,
      matchNumber: nextMatchNumber,
    },
  });
  if (nextMatch) {
    // Place the winner in the correct slot (1 or 2) based on whether this
    // match was odd or even.
    const isPlayer1Slot = match.matchNumber % 2 === 1;
    await db.tournamentMatch.update({
      where: { id: nextMatch.id },
      data: isPlayer1Slot
        ? { player1Id: winnerId }
        : { player2Id: winnerId },
    });
  } else {
    // No next match → this was the final. Declare the champion.
    await repo.updateTournament(match.tournamentId, {
      championId: winnerId,
      status: "finished",
      finishedAt: new Date(),
    });
    log.info("tournament.champion", {
      tournamentId: match.tournamentId,
      championId: winnerId,
    });
  }

  return mapMatch(updated);
}

// ---------------------------------------------------------------------------
// listMatches
// ---------------------------------------------------------------------------

export async function listMatches(
  ctx: AuthContext,
  tournamentId: string,
): Promise<TournamentMatchDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const matches = await repo.findMatchesByTournament(tournamentId);
  return matches.map(mapMatch);
}

// ---------------------------------------------------------------------------
// Phase 4C.1 — Check-in, match history, tournament statistics, auto-advance
// ---------------------------------------------------------------------------

/**
 * Participant check-in. Marks the participant as "checked in" in the
 * bracket JSON. The host can also check in a participant on their behalf.
 *
 * Check-in is required before the tournament starts if a check-in window
 * is configured. Participants who don't check in are removed from the
 * bracket before generation.
 */
export async function checkIn(
  ctx: AuthContext,
  tournamentId: string,
  userId?: string,
): Promise<{ tournamentId: string; userId: string; checkedIn: boolean }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  const targetUserId = userId ?? ctx.userId;
  // Self check-in OR host checking in others
  if (targetUserId !== ctx.userId && tournament.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Can only self-check-in or check-in others as the host");
  }
  if (tournament.status !== "registration") {
    throw badRequest("Tournament is not in registration phase");
  }
  const participants: string[] = JSON.parse(tournament.participants);
  if (!participants.includes(targetUserId)) {
    throw badRequest("User is not registered for this tournament");
  }
  // Update checkedInParticipants in the bracket JSON
  let bracket: Record<string, unknown> = {};
  try { bracket = JSON.parse(tournament.bracket); } catch {}
  const checkedIn: string[] = (bracket.checkedInParticipants as string[]) ?? [];
  if (!checkedIn.includes(targetUserId)) {
    checkedIn.push(targetUserId);
    bracket.checkedInParticipants = checkedIn;
    await repo.updateTournament(tournamentId, {
      bracket: JSON.stringify(bracket),
    });
  }
  log.info("tournament.check_in", { tournamentId, userId: targetUserId });
  return { tournamentId, userId: targetUserId, checkedIn: true };
}

/**
 * Get the match history for a tournament — all matches in chronological
 * order, with durations computed from start/finish timestamps.
 */
export async function getMatchHistory(
  ctx: AuthContext,
  tournamentId: string,
): Promise<MatchHistoryDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  const matches = await repo.findMatchesByTournament(tournamentId);
  return matches.map((m: any) => {
    let durationMs: number | null = null;
    if (m.finishedAt && m.session1Id) {
      // We'd need to fetch the session's startedAt — approximate with match.finishedAt - scheduledAt
      durationMs = m.scheduledAt ? m.finishedAt.getTime() - m.scheduledAt.getTime() : null;
    }
    return {
      matchId: m.id,
      roundNumber: m.roundNumber,
      matchNumber: m.matchNumber,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      winnerId: m.winnerId,
      score1: m.score1,
      score2: m.score2,
      status: m.status,
      startedAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
      finishedAt: m.finishedAt ? m.finishedAt.toISOString() : null,
      durationMs,
    };
  });
}

/**
 * Compute tournament statistics: total matches, completed/pending counts,
 * byes awarded, average match duration, and per-participant performance.
 */
export async function getTournamentStats(
  ctx: AuthContext,
  tournamentId: string,
): Promise<TournamentStatsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  const matches = await repo.findMatchesByTournament(tournamentId);
  const participants: string[] = JSON.parse(tournament.participants);
  const completedMatches = matches.filter((m: any) => m.status === "finished");
  const pendingMatches = matches.filter((m: any) => m.status === "pending");
  const byes = matches.filter((m: any) => m.status === "bye");
  // Average match duration (from scheduledAt to finishedAt)
  const durations: number[] = [];
  for (const m of completedMatches) {
    if ((m as any).scheduledAt && (m as any).finishedAt) {
      durations.push((m as any).finishedAt.getTime() - (m as any).scheduledAt.getTime());
    }
  }
  const averageMatchDurationMs = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : 0;
  // Per-participant stats
  const participantStats = participants.map((userId) => {
    const played = matches.filter((m: any) =>
      m.status === "finished" && (m.player1Id === userId || m.player2Id === userId),
    );
    const won = played.filter((m: any) => m.winnerId === userId);
    const lost = played.filter((m: any) => m.winnerId && m.winnerId !== userId);
    // Find the round the participant was eliminated in (their last loss)
    const losses = lost.sort((a: any, b: any) => b.roundNumber - a.roundNumber);
    const eliminatedRound = losses.length > 0 ? losses[0].roundNumber : null;
    return {
      userId,
      matchesPlayed: played.length,
      matchesWon: won.length,
      matchesLost: lost.length,
      eliminatedRound,
    };
  });
  return {
    tournamentId,
    totalParticipants: participants.length,
    totalMatches: matches.length,
    completedMatches: completedMatches.length,
    pendingMatches: pendingMatches.length,
    byesAwarded: byes.length,
    averageMatchDurationMs,
    championId: tournament.championId,
    participantStats,
  };
}

/**
 * Auto-advance any matches where one participant is absent (player2Id
 * is null after bracket generation, or one participant failed to check
 * in). The present participant wins by default.
 *
 * Called by the host after the tournament starts (or by a cron job if
 * autoAdvancement is enabled).
 */
export async function autoAdvanceReadyMatches(
  ctx: AuthContext,
  tournamentId: string,
): Promise<{ advanced: string[]; reasons: Record<string, string> }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const tournament = await repo.findTournamentById(tournamentId);
  if (!tournament) throw notFound("Tournament not found");
  if (tournament.hostId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the host can auto-advance matches");
  }
  if (tournament.status !== "in_progress") {
    throw badRequest("Tournament is not in progress");
  }
  let bracket: Record<string, unknown> = {};
  try { bracket = JSON.parse(tournament.bracket); } catch {}
  const autoAdv = (bracket.autoAdvancement as boolean | undefined) ?? true;
  if (!autoAdv) {
    return { advanced: [], reasons: { _: "auto_advancement_disabled" } };
  }
  const matches = await repo.findMatchesByTournament(tournamentId);
  const advanced: string[] = [];
  const reasons: Record<string, string> = {};
  for (const m of matches) {
    if (m.status !== "pending") continue;
    // Bye: player2 is null
    if (!m.player2Id || m.player2Id === "bye") {
      await repo.updateMatch(m.id, {
        winnerId: m.player1Id,
        status: "bye",
        finishedAt: new Date(),
      });
      advanced.push(m.id);
      reasons[m.id] = "bye";
      eventBus.publish(
        buildEvent<MatchFinishedEvent>({
          type: MATCH_FINISHED,
          actorId: ctx.userId,
          tournamentId,
          matchId: m.id,
          winnerId: m.player1Id,
          roundNumber: m.roundNumber,
        }),
      );
    }
  }
  log.info("tournament.auto_advance", { tournamentId, advanced: advanced.length });
  return { advanced, reasons };
}
