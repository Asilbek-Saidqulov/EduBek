import { db } from "@/lib/db";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import type { RoomStateSnapshot, SanitizedQuestion } from "@/features/multiplayer/types";

export type StoredQuestion = {
  id: string;
  prompt: string;
  type?: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation?: string;
  points?: number;
  durationMs?: number;
};

const FALLBACK_QUESTIONS: StoredQuestion[] = [
  {
    id: "q_default_1",
    prompt: "Which organelle produces most of the ATP in a plant or animal cell?",
    type: "multiple_choice",
    options: ["Ribosome", "Mitochondrion", "Golgi apparatus", "Nucleus"],
    correctIndex: 1,
    correctAnswer: "Mitochondrion",
    explanation: "Mitochondria run cellular respiration and make most ATP.",
    points: 100,
    durationMs: 20000,
  },
  {
    id: "q_default_2",
    prompt: "2x + 6 = 14. What is x?",
    type: "multiple_choice",
    options: ["2", "4", "6", "8"],
    correctIndex: 1,
    correctAnswer: "4",
    explanation: "2x = 8, so x = 4.",
    points: 100,
    durationMs: 20000,
  },
  {
    id: "q_default_3",
    prompt: "Toshkent O‘zbekiston poytaxtimi?",
    type: "true_false",
    options: ["True", "False"],
    correctIndex: 0,
    correctAnswer: "True",
    explanation: "Toshkent — O‘zbekiston poytaxti.",
    points: 100,
    durationMs: 15000,
  },
  {
    id: "q_default_4",
    prompt: "A queue is First-In, First-Out (FIFO).",
    type: "true_false",
    options: ["True", "False"],
    correctIndex: 0,
    correctAnswer: "True",
    explanation: "A queue serves the earliest item first.",
    points: 100,
    durationMs: 15000,
  },
];

function parseConfig(raw: string | null | undefined): { questions: StoredQuestion[] } {
  try {
    const parsed = JSON.parse(raw || "{}");
    const questions = Array.isArray(parsed.questions) ? parsed.questions : FALLBACK_QUESTIONS;
    return { questions: questions.length ? questions : FALLBACK_QUESTIONS };
  } catch {
    return { questions: FALLBACK_QUESTIONS };
  }
}

function sanitize(q: StoredQuestion, index: number, total: number): SanitizedQuestion {
  return {
    id: q.id || `q_${index + 1}`,
    prompt: q.prompt,
    type: q.type || "multiple_choice",
    options: q.options || [],
    durationMs: q.durationMs || 20000,
    points: q.points || 100,
    roundNumber: index + 1,
    totalRounds: total,
  };
}

function isCorrectAnswer(q: StoredQuestion, answer: unknown): boolean {
  if (typeof answer === "number") {
    return answer === q.correctIndex || String(q.options[answer] || "") === q.correctAnswer;
  }
  const text = String(answer ?? "").trim().toLowerCase();
  if (!text) return false;
  if (text === String(q.correctAnswer).trim().toLowerCase()) return true;
  const idx = q.options.findIndex((opt) => opt.trim().toLowerCase() === text);
  return idx === q.correctIndex;
}

export async function findDurableSession(codeOrId: string) {
  const key = codeOrId.trim();
  const session = await db.liveSession.findFirst({
    where: {
      OR: [
        { id: key },
        { code: key.toUpperCase() },
        { lobby: { is: { joinCode: key.toUpperCase() } } },
      ],
    },
    include: {
      players: { where: { status: { not: "left" } }, orderBy: { score: "desc" } },
      rounds: { orderBy: { roundNumber: "desc" }, take: 1 },
      lobby: true,
    },
  });
  return session;
}

export function buildSnapshot(
  session: NonNullable<Awaited<ReturnType<typeof findDurableSession>>>,
  viewerPlayerId?: string,
  isHost = false,
): RoomStateSnapshot {
  const { questions } = parseConfig(session.config);
  const current = session.rounds[0];
  const qIndex = Math.max(0, (session.currentRound || 1) - 1);
  const stored = questions[qIndex];
  let activeQuestion: SanitizedQuestion | null = null;
  if (session.status === "in_progress" && stored) {
    activeQuestion = sanitize(stored, qIndex, questions.length);
  }

  const leaderboard = session.players.map((p, i) => ({
    playerId: p.id,
    userId: p.userId,
    displayName: p.displayName,
    role: (p.role === "host" ? "host" : "player") as "host" | "player",
    score: p.score,
    rank: i + 1,
    correctCount: p.correctCount,
    currentStreak: p.currentStreak,
    lastPointsEarned: 0,
    change: 0,
    isReady: true,
    status: (p.status as "active" | "disconnected") || "active",
    hasAnsweredCurrentRound: false,
  }));

  return {
    roomId: session.id,
    code: session.code,
    hostId: session.hostId,
    title: session.title,
    description: session.description,
    gameMode: (session.gameMode as RoomStateSnapshot["gameMode"]) || "classic",
    status: (session.status as RoomStateSnapshot["status"]) || "lobby",
    currentRound: session.currentRound || 0,
    totalRounds: session.totalRounds || questions.length,
    durationMs: stored?.durationMs || 20000,
    roundStartedAt: current?.startedAt?.toISOString() || null,
    roundEndsAt: current?.answerLockAt?.toISOString() || null,
    serverTime: new Date().toISOString(),
    activeQuestion,
    lastQuestionResult: null,
    leaderboard,
    myPlayerId: viewerPlayerId,
    isHost,
    hasSubmittedAnswer: false,
    canStart: session.status === "lobby",
  };
}

export async function persistQuestionsOnCreate(sessionId: string, questions?: StoredQuestion[]) {
  const list = questions && questions.length ? questions : FALLBACK_QUESTIONS;
  const session = await db.liveSession.findUnique({ where: { id: sessionId } });
  if (!session) return list;
  const cfg = parseConfig(session.config);
  const next = {
    ...JSON.parse(session.config || "{}"),
    questions: cfg.questions?.length ? cfg.questions : list,
  };
  if (!Array.isArray(JSON.parse(session.config || "{}").questions)) {
    await db.liveSession.update({
      where: { id: sessionId },
      data: { config: JSON.stringify(next), totalRounds: list.length },
    });
  }
  return list;
}

export async function durableJoin(params: {
  code: string;
  displayName: string;
  userId?: string | null;
  isGuest?: boolean;
}) {
  const session = await findDurableSession(params.code);
  if (!session) throw notFound("No live room found for this PIN");
  if (session.status === "finished") throw badRequest("This live room has already finished");
  if (session.players.length >= session.maxPlayers) throw badRequest("Room is full");

  await persistQuestionsOnCreate(session.id);

  let player = params.userId
    ? session.players.find((p) => p.userId === params.userId)
    : session.players.find(
        (p) => p.isGuest && p.displayName.toLowerCase() === params.displayName.trim().toLowerCase(),
      );

  if (!player) {
    player = await db.livePlayer.create({
      data: {
        sessionId: session.id,
        userId: params.userId || undefined,
        displayName: params.displayName.trim().slice(0, 30) || "Player",
        role: params.userId && params.userId === session.hostId ? "host" : "player",
        isGuest: Boolean(params.isGuest || !params.userId),
        status: "active",
      },
    });
  } else {
    player = await db.livePlayer.update({
      where: { id: player.id },
      data: { status: "active", lastSeenAt: new Date(), disconnectedAt: null },
    });
  }

  const fresh = await findDurableSession(session.id);
  if (!fresh) throw notFound("Room disappeared");
  const isHost = player.role === "host" || player.userId === fresh.hostId;
  return {
    session: fresh,
    player,
    snapshot: buildSnapshot(fresh, player.id, isHost),
  };
}

export async function durableStatus(sessionId: string, playerId?: string) {
  const session = await findDurableSession(sessionId);
  if (!session) throw notFound("Live room not found");
  const player = playerId ? session.players.find((p) => p.id === playerId) : undefined;
  const isHost = Boolean(player && (player.role === "host" || player.userId === session.hostId));

  let hasSubmittedAnswer = false;
  const current = session.rounds[0];
  if (current && player) {
    const existing = await db.liveAnswer.findUnique({
      where: { roundId_playerId: { roundId: current.id, playerId: player.id } },
    });
    hasSubmittedAnswer = Boolean(existing);
  }

  const snap = buildSnapshot(session, player?.id, isHost);
  snap.hasSubmittedAnswer = hasSubmittedAnswer;
  return { session, player, snapshot: snap, currentRound: current };
}

export async function durableStart(sessionId: string, hostUserId: string) {
  const session = await findDurableSession(sessionId);
  if (!session) throw notFound("Live room not found");
  if (session.hostId !== hostUserId) throw forbidden("Only the host can start");

  const questions = (await persistQuestionsOnCreate(session.id)) || FALLBACK_QUESTIONS;
  const first = questions[0];
  const durationMs = first?.durationMs || 20000;
  const now = new Date();
  const lockAt = new Date(now.getTime() + durationMs);

  const updated = await db.liveSession.update({
    where: { id: session.id },
    data: {
      status: "in_progress",
      currentRound: 1,
      totalRounds: questions.length,
      startedAt: session.startedAt || now,
    },
  });

  const round = await db.liveRound.upsert({
    where: { sessionId_roundNumber: { sessionId: session.id, roundNumber: 1 } },
    update: {
      status: "active",
      startedAt: now,
      answerLockAt: lockAt,
      questionSnapshot: JSON.stringify(first),
    },
    create: {
      sessionId: session.id,
      roundNumber: 1,
      status: "active",
      startedAt: now,
      answerLockAt: lockAt,
      questionDurationMs: durationMs,
      questionSnapshot: JSON.stringify(first),
    },
  });

  const fresh = await findDurableSession(updated.id);
  return { session: fresh!, round, snapshot: buildSnapshot(fresh!, undefined, true) };
}

export async function durableAnswer(params: {
  sessionId: string;
  playerId: string;
  answer: unknown;
}) {
  const session = await findDurableSession(params.sessionId);
  if (!session) throw notFound("Live room not found");
  if (session.status !== "in_progress") throw badRequest("No active question");

  const player = session.players.find((p) => p.id === params.playerId);
  if (!player) throw notFound("Player is not in this room");

  const { questions } = parseConfig(session.config);
  const qIndex = Math.max(0, (session.currentRound || 1) - 1);
  const question = questions[qIndex];
  if (!question) throw badRequest("Question missing");

  const current = session.rounds[0];
  if (!current) throw badRequest("Round not started");
  if (current.answerLockAt && current.answerLockAt.getTime() < Date.now()) {
    throw badRequest("Time is up for this question");
  }

  const correct = isCorrectAnswer(question, params.answer);
  const points = correct ? question.points || 100 : 0;

  const existing = await db.liveAnswer.findUnique({
    where: { roundId_playerId: { roundId: current.id, playerId: player.id } },
  });
  if (existing) {
    return {
      recorded: true,
      isCorrect: existing.isCorrect,
      pointsAwarded: existing.pointsAwarded,
      score: player.score,
    };
  }

  await db.liveAnswer.create({
    data: {
      roundId: current.id,
      playerId: player.id,
      answer: String(params.answer ?? ""),
      isCorrect: correct,
      pointsAwarded: points,
    },
  });

  const updated = await db.livePlayer.update({
    where: { id: player.id },
    data: {
      score: { increment: points },
      correctCount: { increment: correct ? 1 : 0 },
      wrongCount: { increment: correct ? 0 : 1 },
      answeredCount: { increment: 1 },
    },
  });

  await db.liveRound.update({
    where: { id: current.id },
    data: {
      answerCount: { increment: 1 },
      correctCount: { increment: correct ? 1 : 0 },
    },
  });

  return {
    recorded: true,
    isCorrect: correct,
    pointsAwarded: points,
    score: updated.score,
    correctAnswer: question.correctAnswer,
  };
}

export async function durableNext(sessionId: string, hostUserId: string) {
  const session = await findDurableSession(sessionId);
  if (!session) throw notFound("Live room not found");
  if (session.hostId !== hostUserId) throw forbidden("Only the host can continue");

  const { questions } = parseConfig(session.config);
  const nextRound = (session.currentRound || 1) + 1;

  if (session.rounds[0]) {
    await db.liveRound.update({
      where: { id: session.rounds[0].id },
      data: { status: "finished", endedAt: new Date() },
    });
  }

  if (nextRound > questions.length) {
    const finished = await db.liveSession.update({
      where: { id: session.id },
      data: { status: "finished", finishedAt: new Date(), currentRound: questions.length },
    });
    const fresh = await findDurableSession(finished.id);
    return { snapshot: buildSnapshot(fresh!, undefined, true), finished: true };
  }

  const question = questions[nextRound - 1];
  const durationMs = question.durationMs || 20000;
  const now = new Date();
  await db.liveSession.update({
    where: { id: session.id },
    data: { currentRound: nextRound, status: "in_progress" },
  });
  await db.liveRound.create({
    data: {
      sessionId: session.id,
      roundNumber: nextRound,
      status: "active",
      startedAt: now,
      answerLockAt: new Date(now.getTime() + durationMs),
      questionDurationMs: durationMs,
      questionSnapshot: JSON.stringify(question),
    },
  });
  const fresh = await findDurableSession(session.id);
  return { snapshot: buildSnapshot(fresh!, undefined, true), finished: false };
}
