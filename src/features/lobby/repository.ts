/**
 * EduBek — Live Quiz Lobby repository.
 */
import { db } from "@/lib/db";

export async function createLobby(input: {
  sessionId: string;
  joinCode: string;
  passwordHash?: string;
  visibility: string;
  maxPlayers: number;
  settings: string;
}) {
  return db.lobby.create({
    data: {
      sessionId: input.sessionId,
      joinCode: input.joinCode,
      passwordHash: input.passwordHash ?? null,
      visibility: input.visibility,
      maxPlayers: input.maxPlayers,
      settings: input.settings,
      status: "open",
    },
  });
}

export async function findLobbyById(id: string) {
  return db.lobby.findUnique({ where: { id } });
}

export async function findLobbyBySession(sessionId: string) {
  return db.lobby.findUnique({ where: { sessionId } });
}

export async function findLobbyByCode(joinCode: string) {
  return db.lobby.findUnique({ where: { joinCode } });
}

export async function findOpenLobbies() {
  return db.lobby.findMany({
    where: { status: "open", visibility: "public" },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateLobby(id: string, data: {
  visibility?: string;
  maxPlayers?: number;
  locked?: boolean;
  settings?: string;
  waitingRoom?: string;
  status?: string;
  countdownEndsAt?: Date | null;
  passwordHash?: string | null;
}) {
  return db.lobby.update({ where: { id }, data });
}
