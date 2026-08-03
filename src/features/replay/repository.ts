/**
 * EduBek — Live Quiz Replay repository.
 */
import { db } from "@/lib/db";

export async function createReplay(input: {
  sessionId: string;
  events: string;
  finalSnapshot: string;
  durationMs: number;
  visibility: string;
  analyticsSummary?: string;
}) {
  return db.replay.create({ data: input });
}

export async function findReplayById(id: string) {
  return db.replay.findUnique({ where: { id } });
}

export async function findReplayBySession(sessionId: string) {
  return db.replay.findUnique({ where: { sessionId } });
}

export async function findReplaysByUser(userId: string, limit = 50) {
  // Replays are session-scoped; we join through LivePlayer to find the user's replays.
  return db.replay.findMany({
    where: {
      session: { players: { some: { userId } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findReplaysByVisibility(visibility: string, limit = 50) {
  return db.replay.findMany({
    where: { visibility },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function updateReplay(id: string, data: {
  visibility?: string;
  analyticsSummary?: string;
}) {
  return db.replay.update({ where: { id }, data });
}
