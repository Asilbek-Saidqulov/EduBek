import { db } from "@/lib/db";
import { GameRoom } from "./engine";
import { AuthoritativeQuestion, GameMode } from "./types";
import { badRequest, notFound, forbidden } from "@/lib/errors";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1 to prevent visual confusion

export interface CreateRoomInput {
  hostId: string;
  title: string;
  description?: string | null;
  gameMode?: GameMode;
  maxPlayers?: number;
  quizId?: string;
  assessmentId?: string;
  classroomId?: string;
  orgId?: string;
  questions?: AuthoritativeQuestion[];
  resultsDurationMs?: number;
  autoAdvance?: boolean;
}

export class RoomManager {
  private static instance: RoomManager;
  private roomsById: Map<string, GameRoom> = new Map();
  private roomsByCode: Map<string, GameRoom> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start periodic background cleanup for stale in-memory rooms
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanupStaleRooms();
      }, 5 * 60 * 1000); // every 5 minutes
    }
  }

  public static getInstance(): RoomManager {
    const globalObj = globalThis as unknown as { __multiplayerRoomManager?: RoomManager };
    if (!globalObj.__multiplayerRoomManager) {
      globalObj.__multiplayerRoomManager = new RoomManager();
    }
    return globalObj.__multiplayerRoomManager;
  }

  public generateRoomCode(): string {
    let code = "";
    for (let attempts = 0; attempts < 100; attempts++) {
      code = "";
      for (let i = 0; i < 6; i++) {
        const idx = Math.floor(Math.random() * CODE_CHARS.length);
        code += CODE_CHARS[idx];
      }
      if (!this.roomsByCode.has(code)) {
        return code;
      }
    }
    return `R${Date.now().toString().slice(-5)}`;
  }

  /**
   * Creates a new multiplayer room, builds authoritative questions, and persists LiveSession in DB.
   */
  public async createRoom(input: CreateRoomInput): Promise<GameRoom> {
    const code = this.generateRoomCode();
    let questions: AuthoritativeQuestion[] = input.questions || [];

    // If quizId provided, fetch quiz questions from database
    if (input.quizId && questions.length === 0) {
      const quiz = await db.quiz.findUnique({
        where: { id: input.quizId },
        include: {
          questions: {
            orderBy: { orderNum: "asc" },
          },
        },
      });

      if (!quiz) {
        throw notFound("Quiz not found");
      }

      questions = quiz.questions.map((q) => {
        let parsedOptions: string[] = [];
        try {
          parsedOptions = JSON.parse(q.options);
        } catch {
          parsedOptions = [];
        }

        return {
          id: q.id,
          prompt: q.question,
          type: (q.type as any) || "multiple_choice",
          options: parsedOptions,
          correctIndex: q.correctIndex,
          correctAnswer: parsedOptions[q.correctIndex] || undefined,
          explanation: q.explanation || undefined,
          points: q.points || 1,
          durationMs: 30000,
          difficulty: q.difficulty,
        };
      });
    }

    // If assessmentId provided, fetch assessment questions
    if (input.assessmentId && questions.length === 0) {
      const assessment = await db.assessment.findUnique({
        where: { id: input.assessmentId },
        include: {
          questions: {
            include: { question: true },
            orderBy: { order: "asc" },
          },
        },
      });

      if (!assessment) {
        throw notFound("Assessment not found");
      }

      for (const sec of assessment.questions) {
        const bq = sec.question;
        let parsedPayload: any = {};
        try {
          parsedPayload = bq.payload ? JSON.parse(bq.payload) : {};
        } catch {
          parsedPayload = {};
        }

        const options: string[] = Array.isArray(parsedPayload.options)
          ? parsedPayload.options
          : [];
        const correctAns = parsedPayload.correctAnswer || undefined;
        const correctIdx = parsedPayload.correctIndex ?? (correctAns ? options.indexOf(correctAns) : undefined);

        questions.push({
          id: bq.id,
          prompt: bq.prompt,
          type: (bq.questionType as any) || "multiple_choice",
          options,
          correctIndex: correctIdx !== -1 ? correctIdx : undefined,
          correctAnswer: correctAns,
          acceptableAnswers: parsedPayload.acceptableAnswers,
          explanation: parsedPayload.explanation,
          points: sec.points || bq.points || 1,
          durationMs: (sec.timeLimitSeconds || 30) * 1000,
          difficulty: bq.difficulty,
        });
      }
    }

    // Fallback default questions if none provided
    if (questions.length === 0) {
      questions = [
        {
          id: "q_default_1",
          prompt: "Which protocol is used for real-time bidirectional communication in EduBek?",
          type: "multiple_choice",
          options: ["HTTP/1.1 Polling", "Socket.IO / WebSockets", "FTP", "SMTP"],
          correctIndex: 1,
          correctAnswer: "Socket.IO / WebSockets",
          explanation: "Socket.IO provides low-latency full-duplex communication over WebSockets with automatic fallbacks.",
          points: 1,
          durationMs: 20000,
        },
        {
          id: "q_default_2",
          prompt: "In server-authoritative multiplayer games, the client determines the final score.",
          type: "true_false",
          options: ["True", "False"],
          correctIndex: 1,
          correctAnswer: "False",
          explanation: "The server must always own time, correctness, point calculations, and leaderboard state.",
          points: 1,
          durationMs: 15000,
        },
        {
          id: "q_default_3",
          prompt: "What is the primary capital of Uzbekistan?",
          type: "multiple_choice",
          options: ["Samarkand", "Bukhara", "Tashkent", "Khiva"],
          correctIndex: 2,
          correctAnswer: "Tashkent",
          explanation: "Tashkent is the capital and largest city of Uzbekistan.",
          points: 1,
          durationMs: 20000,
        },
      ];
    }

    // Persist LiveSession to Prisma database
    const session = await db.liveSession.create({
      data: {
        code,
        hostId: input.hostId,
        title: input.title,
        description: input.description,
        gameMode: input.gameMode || "classic",
        classroomId: input.classroomId,
        orgId: input.orgId,
        assessmentId: input.assessmentId,
        maxPlayers: input.maxPlayers || 50,
        totalRounds: questions.length,
        status: "lobby",
        config: JSON.stringify({
          quizId: input.quizId,
          assessmentId: input.assessmentId,
          autoAdvance: input.autoAdvance ?? false,
          resultsDurationMs: input.resultsDurationMs ?? 5000,
        }),
      },
    });

    // Create Lobby entry
    await db.lobby.create({
      data: {
        sessionId: session.id,
        joinCode: code,
        maxPlayers: input.maxPlayers || 50,
      },
    });

    // Instantiate in-memory GameRoom
    const room = new GameRoom({
      roomId: session.id,
      code,
      hostId: input.hostId,
      title: input.title,
      description: input.description,
      gameMode: input.gameMode,
      maxPlayers: input.maxPlayers,
      questions,
      resultsDurationMs: input.resultsDurationMs,
      onStateChange: (r, eventName, data) => {
        this.handleRoomStateChange(r, eventName, data);
      },
    });

    this.roomsById.set(session.id, room);
    this.roomsByCode.set(code, room);

    return room;
  }

  public getRoomById(roomId: string): GameRoom | undefined {
    return this.roomsById.get(roomId);
  }

  public getRoomByCode(code: string): GameRoom | undefined {
    return this.roomsByCode.get(code.trim().toUpperCase());
  }

  public removeRoom(roomId: string): void {
    const room = this.roomsById.get(roomId);
    if (!room) return;

    this.roomsById.delete(roomId);
    this.roomsByCode.delete(room.code);
    room.destroy();
  }

  public getAllActiveRooms(): GameRoom[] {
    return Array.from(this.roomsById.values());
  }

  /**
   * Persists state events to Prisma asynchronously without blocking socket loop.
   */
  private async handleRoomStateChange(room: GameRoom, eventName: string, data?: any): Promise<void> {
    try {
      switch (eventName) {
        case "player:joined": {
          const p = data.player;
          await db.livePlayer.upsert({
            where: {
              sessionId_userId: {
                sessionId: room.roomId,
                userId: p.userId || p.id,
              },
            },
            update: {
              socketId: p.socketId,
              displayName: p.displayName,
              status: "active",
              role: p.role,
              lastSeenAt: new Date(),
            },
            create: {
              id: p.id,
              sessionId: room.roomId,
              userId: p.userId || null,
              isGuest: p.isGuest,
              displayName: p.displayName,
              role: p.role,
              status: "active",
              socketId: p.socketId,
              score: 0,
            },
          });
          break;
        }

        case "game:countdown":
        case "question:active": {
          await db.liveSession.update({
            where: { id: room.roomId },
            data: {
              status: "in_progress",
              currentRound: room.currentRoundIndex + 1,
              startedAt: room.currentRoundIndex === 0 ? new Date() : undefined,
            },
          });

          const currentQ = room.getAuthoritativeQuestion(room.currentRoundIndex);
          if (currentQ) {
            await db.liveRound.upsert({
              where: {
                sessionId_roundNumber: {
                  sessionId: room.roomId,
                  roundNumber: room.currentRoundIndex + 1,
                },
              },
              update: {
                status: "active",
                startedAt: new Date(),
                questionDurationMs: currentQ.durationMs,
              },
              create: {
                sessionId: room.roomId,
                roundNumber: room.currentRoundIndex + 1,
                questionSnapshot: JSON.stringify(currentQ),
                questionDurationMs: currentQ.durationMs,
                status: "active",
                startedAt: new Date(),
              },
            });
          }
          break;
        }

        case "question:result": {
          const snapshot = data.result;
          const leaderboard = data.leaderboard;

          // Update LiveRound in DB
          const currentRound = await db.liveRound.findUnique({
            where: {
              sessionId_roundNumber: {
                sessionId: room.roomId,
                roundNumber: room.currentRoundIndex + 1,
              },
            },
          });

          if (currentRound) {
            await db.liveRound.update({
              where: { id: currentRound.id },
              data: {
                status: "finished",
                endedAt: new Date(),
                answerCount: snapshot.totalAnswers,
                correctCount: snapshot.correctAnswersCount,
                resultsSnapshot: JSON.stringify(snapshot),
              },
            });

            // Persist individual answers
            const roundAnswers = room.getRoundAnswers();
            for (const [playerId, ans] of roundAnswers.entries()) {
              await db.liveAnswer.upsert({
                where: {
                  roundId_playerId: {
                    roundId: currentRound.id,
                    playerId,
                  },
                },
                update: {
                  answer: JSON.stringify(ans.answer),
                  isCorrect: ans.isCorrect,
                  responseMs: ans.responseMs,
                  pointsAwarded: ans.pointsAwarded,
                },
                create: {
                  roundId: currentRound.id,
                  playerId,
                  answer: JSON.stringify(ans.answer),
                  isCorrect: ans.isCorrect,
                  responseMs: ans.responseMs,
                  pointsAwarded: ans.pointsAwarded,
                },
              });

              // Update Player score & aggregates in DB
              const p = room.getPlayerById(playerId);
              if (p) {
                await db.livePlayer.update({
                  where: { id: playerId },
                  data: {
                    score: p.score,
                    accuracy: p.accuracy,
                    correctCount: p.correctCount,
                    wrongCount: p.wrongCount,
                    currentStreak: p.currentStreak,
                    longestStreak: p.longestStreak,
                    avgResponseMs: p.avgResponseMs,
                    totalResponseMs: p.totalResponseMs,
                    answeredCount: p.answeredCount,
                  },
                });
              }
            }
          }

          // Save Leaderboard snapshot
          await db.liveLeaderboard.create({
            data: {
              sessionId: room.roomId,
              roundNumber: room.currentRoundIndex + 1,
              entries: JSON.stringify(leaderboard),
            },
          });
          break;
        }

        case "game:finished": {
          const finalLeaderboard = data.finalLeaderboard;
          await db.liveSession.update({
            where: { id: room.roomId },
            data: {
              status: "finished",
              finishedAt: new Date(),
              leaderboardSnapshot: JSON.stringify(finalLeaderboard),
            },
          });

          for (const entry of finalLeaderboard) {
            await db.livePlayer.update({
              where: { id: entry.playerId },
              data: {
                finalRank: entry.rank,
                score: entry.score,
              },
            });
          }
          break;
        }

        case "game:cancelled": {
          await db.liveSession.update({
            where: { id: room.roomId },
            data: { status: "cancelled" },
          });
          break;
        }
      }
    } catch (err) {
      console.error(`[RoomManager] DB persistence error for room ${room.roomId}:`, err);
    }
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    for (const [id, room] of this.roomsById.entries()) {
      if (room.status === "finished" || room.status === "cancelled") {
        this.removeRoom(id);
      }
    }
  }
}
