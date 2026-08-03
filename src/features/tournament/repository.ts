/**
 * EduBek — Live Quiz Tournament repository.
 */
import { db } from "@/lib/db";

export interface CreateTournamentInput {
  name: string;
  description?: string;
  hostId: string;
  orgId?: string;
  classroomId?: string;
  gameMode: string;
  format: string;
  bracketSize: number;
  participants: string;
}

export async function createTournament(input: CreateTournamentInput) {
  return db.tournament.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      hostId: input.hostId,
      orgId: input.orgId ?? null,
      classroomId: input.classroomId ?? null,
      gameMode: input.gameMode,
      format: input.format,
      bracketSize: input.bracketSize,
      status: "registration",
      participants: input.participants,
    },
  });
}

export async function findTournamentById(id: string) {
  return db.tournament.findUnique({
    where: { id },
    include: { matches: { orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }] } },
  });
}

export async function listTournaments(input: {
  status?: string;
  hostId?: string;
  classroomId?: string;
  orgId?: string;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.status) where.status = input.status;
  if (input.hostId) where.hostId = input.hostId;
  if (input.classroomId) where.classroomId = input.classroomId;
  if (input.orgId) where.orgId = input.orgId;
  const [items, total] = await Promise.all([
    db.tournament.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    db.tournament.count({ where }),
  ]);
  return { items, total };
}

export async function updateTournament(id: string, data: {
  status?: string;
  participants?: string;
  bracket?: string;
  championId?: string | null;
  startedAt?: Date;
  finishedAt?: Date;
}) {
  return db.tournament.update({ where: { id }, data });
}

export async function createMatch(input: {
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  player1Id: string;
  player2Id?: string;
  status?: string;
}) {
  return db.tournamentMatch.create({
    data: {
      tournamentId: input.tournamentId,
      roundNumber: input.roundNumber,
      matchNumber: input.matchNumber,
      player1Id: input.player1Id,
      player2Id: input.player2Id ?? null,
      status: input.status ?? "pending",
    },
  });
}

export async function findMatchById(id: string) {
  return db.tournamentMatch.findUnique({ where: { id } });
}

export async function findMatchesByTournament(tournamentId: string) {
  return db.tournamentMatch.findMany({
    where: { tournamentId },
    orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
  });
}

export async function findMatchesByRound(tournamentId: string, roundNumber: number) {
  return db.tournamentMatch.findMany({
    where: { tournamentId, roundNumber },
    orderBy: { matchNumber: "asc" },
  });
}

export async function updateMatch(id: string, data: {
  winnerId?: string | null;
  score1?: number | null;
  score2?: number | null;
  status?: string;
  session1Id?: string | null;
  finishedAt?: Date;
  scheduledAt?: Date;
}) {
  return db.tournamentMatch.update({ where: { id }, data });
}
