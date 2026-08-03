/**
 * EduBek — Live Quiz Participant repository.
 */
import { db } from "@/lib/db";

export async function findPlayerById(id: string) {
  return db.livePlayer.findUnique({ where: { id } });
}

export async function findPlayersBySession(sessionId: string) {
  return db.livePlayer.findMany({
    where: { sessionId },
    orderBy: { score: "desc" },
  });
}

export async function findPlayersByUser(userId: string) {
  return db.livePlayer.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
  });
}

export async function updatePlayer(id: string, data: {
  displayName?: string;
  status?: string;
}) {
  return db.livePlayer.update({ where: { id }, data });
}

export async function findPlayerStats(userId: string) {
  const players = await db.livePlayer.findMany({
    where: { userId, status: { in: ["active", "eliminated", "left"] } },
    include: {
      session: { select: { id: true, title: true, gameMode: true, status: true, finishedAt: true } },
    },
  });
  return players;
}
