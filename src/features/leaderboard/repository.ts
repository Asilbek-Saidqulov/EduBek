/**
 * EduBek — Live Quiz Leaderboard repository.
 */
import { db } from "@/lib/db";

export async function saveSnapshot(input: {
  sessionId: string;
  roundNumber: number;
  entries: string;
}) {
  return db.liveLeaderboard.create({ data: input });
}

export async function findLatest(sessionId: string) {
  return db.liveLeaderboard.findFirst({
    where: { sessionId },
    orderBy: { roundNumber: "desc" },
  });
}

export async function findHistory(sessionId: string) {
  return db.liveLeaderboard.findMany({
    where: { sessionId },
    orderBy: { roundNumber: "asc" },
  });
}

export async function findBySessionAndRound(sessionId: string, roundNumber: number) {
  return db.liveLeaderboard.findFirst({
    where: { sessionId, roundNumber },
  });
}
