import { z } from "zod";
import { db } from "@/lib/db";
import { type AuthContext } from "@/features/auth";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
} from "@/lib/errors";
import { RoomManager } from "./multiplayer/room-manager";
import { GameRoom } from "./multiplayer/engine";
import { GameMode, AuthoritativeQuestion } from "./multiplayer/types";

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

export const createSessionBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(2000).optional(),
  gameMode: z.enum(["classic", "royale", "heist", "empire"]).default("classic"),
  maxPlayers: z.number().int().min(1).max(500).default(50),
  quizId: z.string().optional(),
  assessmentId: z.string().optional(),
  classroomId: z.string().optional(),
  orgId: z.string().optional(),
  questions: z.array(z.any()).optional(),
  autoAdvance: z.boolean().default(false),
  resultsDurationMs: z.number().int().min(1000).max(60000).default(5000),
});
export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;

export const listSessionsQuerySchema = z.object({
  status: z.string().optional(),
  classroomId: z.string().optional(),
  gameMode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

export const joinSessionBodySchema = z.object({
  code: z.string().min(1, "Join code is required"),
  displayName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  password: z.string().optional(),
});
export type JoinSessionBody = z.infer<typeof joinSessionBodySchema>;

export const startSessionBodySchema = z.object({
  countdownSeconds: z.number().int().min(0).max(10).default(3),
});
export type StartSessionBody = z.infer<typeof startSessionBodySchema>;

export const submitAnswerBodySchema = z.object({
  answer: z.any(),
  responseMs: z.number().int().min(0).optional(),
  submissionId: z.string().optional(),
});
export type SubmitAnswerBody = z.infer<typeof submitAnswerBodySchema>;

export const updateSessionBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  maxPlayers: z.number().int().min(1).max(500).optional(),
  gameMode: z.enum(["classic", "royale", "heist", "empire"]).optional(),
});
export type UpdateSessionBody = z.infer<typeof updateSessionBodySchema>;

// -----------------------------------------------------------------------------
// Service Functions
// -----------------------------------------------------------------------------

const roomManager = RoomManager.getInstance();

export async function createSession(ctx: AuthContext, body: CreateSessionBody) {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw unauthorized("Must be logged in to host a live session");
  }

  if (body.quizId) {
    const quiz = await db.quiz.findUnique({ where: { id: body.quizId }, select: { teacherId: true, isPublished: true } });
    if (!quiz) throw notFound("Quiz not found");
    if (quiz.teacherId !== ctx.userId && !quiz.isPublished) {
      throw forbidden("You are not authorized to use this quiz in a multiplayer session");
    }
  }

  if (body.assessmentId) {
    const assessment = await db.assessment.findUnique({ where: { id: body.assessmentId }, select: { ownerId: true, status: true } });
    if (!assessment) throw notFound("Assessment not found");
    if (assessment.ownerId !== ctx.userId && assessment.status !== "published") {
      throw forbidden("You are not authorized to use this assessment in a multiplayer session");
    }
  }

  const room = await roomManager.createRoom({
    hostId: ctx.userId,
    title: body.title,
    description: body.description,
    gameMode: body.gameMode as GameMode,
    maxPlayers: body.maxPlayers,
    quizId: body.quizId,
    assessmentId: body.assessmentId,
    classroomId: body.classroomId,
    orgId: body.orgId,
    questions: body.questions,
    autoAdvance: body.autoAdvance,
    resultsDurationMs: body.resultsDurationMs,
  });

  // Automatically register host as first player in room
  room.addOrUpdatePlayer({
    userId: ctx.userId,
    displayName: ctx.email?.split("@")[0] || "Host",
    role: "host",
    isGuest: false,
  });

  return {
    success: true,
    session: {
      id: room.roomId,
      code: room.code,
      title: room.title,
      description: room.description,
      gameMode: room.gameMode,
      maxPlayers: room.maxPlayers,
      totalRounds: room.totalRounds,
      status: room.status,
      hostId: room.hostId,
    },
    snapshot: room.getStateSnapshot(ctx.userId),
  };
}

export async function listSessions(ctx: AuthContext, query: ListSessionsQuery) {
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.classroomId) where.classroomId = query.classroomId;
  if (query.gameMode) where.gameMode = query.gameMode;

  const [total, sessions] = await Promise.all([
    db.liveSession.count({ where }),
    db.liveSession.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        players: {
          select: { id: true, displayName: true, score: true, role: true },
        },
        lobby: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: sessions,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getSession(ctx: AuthContext, id: string) {
  let room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);

  if (room) {
    const player = ctx.userId ? room.getPlayerByUserId(ctx.userId) : undefined;
    return {
      session: room.getStateSnapshot(player?.id),
    };
  }

  // Fallback to database
  const session = await db.liveSession.findFirst({
    where: {
      OR: [{ id }, { code: id.toUpperCase() }],
    },
    include: {
      host: { select: { id: true, name: true, email: true } },
      players: { orderBy: { score: "desc" } },
      rounds: { orderBy: { roundNumber: "asc" } },
      leaderboard: { orderBy: { roundNumber: "desc" }, take: 1 },
      lobby: true,
    },
  });

  if (!session) {
    throw notFound("Live session not found");
  }

  return { session };
}

export async function joinSession(ctx: AuthContext, body: JoinSessionBody) {
  const code = body.code.trim().toUpperCase();
  const room = roomManager.getRoomByCode(code);

  if (!room) {
    throw notFound("No active multiplayer room found for this code");
  }

  const displayName =
    body.displayName?.trim() ||
    (ctx.email ? ctx.email.split("@")[0] : `Player_${Math.floor(1000 + Math.random() * 9000)}`);

  const { player, isNew } = room.addOrUpdatePlayer({
    userId: ctx.userId || null,
    displayName,
    avatarUrl: body.avatarUrl || null,
    isGuest: !ctx.userId,
  });

  const snapshot = room.getStateSnapshot(player.id);

  return {
    success: true,
    isNew,
    player,
    session: snapshot,
  };
}

export async function leaveSession(ctx: AuthContext, id: string) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) return { success: true };

  const player = ctx.userId ? room.getPlayerByUserId(ctx.userId) : undefined;
  if (player) {
    room.removePlayer(player.id);
  }

  return { success: true };
}

export async function reconnectPlayer(ctx: AuthContext, id: string) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) {
    throw notFound("Room not found or expired");
  }

  const player = ctx.userId ? room.getPlayerByUserId(ctx.userId) : undefined;
  if (!player) {
    throw notFound("Player not registered in this match");
  }

  player.status = "active";
  player.disconnectedAt = null;

  return {
    success: true,
    player,
    snapshot: room.getStateSnapshot(player.id),
  };
}

export async function setPlayerReady(ctx: AuthContext, id: string, ready: boolean) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) {
    throw notFound("Room not found");
  }

  const player = ctx.userId ? room.getPlayerByUserId(ctx.userId) : undefined;
  if (!player) {
    throw notFound("Player not registered in this match");
  }

  const updated = room.setPlayerReady(player.id, ready);
  return {
    success: true,
    player: updated,
    snapshot: room.getStateSnapshot(player.id),
  };
}

export async function startSession(ctx: AuthContext, id: string, body?: StartSessionBody) {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw unauthorized("Must be authenticated host to start session");
  }

  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) {
    throw notFound("Room not found");
  }

  if (room.hostId !== ctx.userId) {
    throw forbidden("Only the host can start the match");
  }

  const player = room.getPlayerByUserId(ctx.userId);
  room.startCountdown(player ? player.id : ctx.userId);

  return {
    success: true,
    message: "Match countdown started",
    snapshot: room.getStateSnapshot(player?.id),
  };
}

export async function submitAnswer(ctx: AuthContext, id: string, body: SubmitAnswerBody) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) {
    throw notFound("Room not found or already closed");
  }

  const player = ctx.userId ? room.getPlayerByUserId(ctx.userId) : undefined;
  if (!player) {
    throw notFound("Player is not part of this session");
  }

  const { record, isFirstSubmission } = room.submitAnswer(player.id, {
    roundNumber: room.currentRoundIndex + 1,
    answer: body.answer,
    submissionId: body.submissionId,
  });

  return {
    success: true,
    isFirstSubmission,
    pointsAwarded: record.pointsAwarded,
    isCorrect: record.isCorrect,
    speedBonus: record.speedBonus,
    streakBonus: record.streakBonus,
    currentScore: player.score,
  };
}

export async function finishRound(ctx: AuthContext, id: string) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");

  if (ctx.userId && room.hostId !== ctx.userId) {
    throw forbidden("Only host can force finish round");
  }

  room.finishRound();
  return {
    success: true,
    snapshot: room.getStateSnapshot(),
  };
}

export async function startNextRound(ctx: AuthContext, id: string) {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw unauthorized("Host authentication required");
  }

  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");

  if (room.hostId !== ctx.userId) {
    throw forbidden("Only host can advance round");
  }

  const player = room.getPlayerByUserId(ctx.userId);
  room.nextQuestion(player ? player.id : ctx.userId);

  return {
    success: true,
    roundNumber: room.currentRoundIndex + 1,
    snapshot: room.getStateSnapshot(player?.id),
  };
}

export async function endSession(ctx: AuthContext, id: string, cancel: boolean = false) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) return { success: true };

  if (ctx.userId && room.hostId !== ctx.userId) {
    throw forbidden("Only host can end or cancel match");
  }

  if (cancel) {
    room.cancelMatch("Match was cancelled by host");
  } else {
    room.finishMatch();
  }

  return {
    success: true,
    status: room.status,
  };
}

export async function syncSessionState(ctx: AuthContext, id: string, lastSeenAt: Date) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) {
    throw notFound("Room not found or expired");
  }

  const player = ctx.userId ? room.getPlayerByUserId(ctx.userId) : undefined;
  const snapshot = room.getStateSnapshot(player?.id);

  return {
    success: true,
    snapshot,
    missedEventsCount: 0,
    serverTime: new Date().toISOString(),
  };
}

export async function endQuestionEarly(ctx: AuthContext, id: string) {
  return finishRound(ctx, id);
}

export async function extendTimer(ctx: AuthContext, id: string, seconds: number = 10) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");
  return { success: true };
}

export async function skipCountdown(ctx: AuthContext, id: string) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");
  if (room.status === "countdown") {
    room.startRound(0);
  }
  return { success: true };
}

export async function pauseSession(ctx: AuthContext, id: string) {
  return { success: true };
}

export async function pauseCountdown(ctx: AuthContext, id: string) {
  return { success: true };
}

export async function resumeSession(ctx: AuthContext, id: string) {
  return { success: true };
}

export async function kickPlayer(ctx: AuthContext, id: string, playerId: string) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");

  if (ctx.userId && room.hostId !== ctx.userId) {
    throw forbidden("Only host can kick players");
  }

  room.removePlayer(playerId);
  return { success: true };
}

export async function migrateHost(ctx: AuthContext, id: string, newHostId: string) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");
  return { success: true };
}

export async function togglePlayerMute(ctx: AuthContext, id: string, playerId: string) {
  return { success: true };
}

export async function updateSession(ctx: AuthContext, id: string, body: UpdateSessionBody) {
  const room = roomManager.getRoomById(id) || roomManager.getRoomByCode(id);
  if (!room) throw notFound("Room not found");

  if (ctx.userId && room.hostId !== ctx.userId) {
    throw forbidden("Only host can update session settings");
  }

  return {
    success: true,
    session: room.getStateSnapshot(),
  };
}
