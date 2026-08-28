import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import { RoomManager } from "./room-manager";
import { GameRoom } from "./engine";
import { checkActionRateLimit } from "./anti-cheat";
import { PlayerAnswerSubmission } from "./types";

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string | null;
    email?: string | null;
    displayName?: string;
    isGuest?: boolean;
    currentRoomId?: string;
    playerId?: string;
  };
}

export class SocketGateway {
  private static instance: SocketGateway;
  private io: SocketIOServer | null = null;
  private roomManager: RoomManager;

  private constructor() {
    this.roomManager = RoomManager.getInstance();
  }

  public static getInstance(): SocketGateway {
    const globalObj = globalThis as unknown as { __socketGateway?: SocketGateway };
    if (!globalObj.__socketGateway) {
      globalObj.__socketGateway = new SocketGateway();
    }
    return globalObj.__socketGateway;
  }

  public initialize(httpServer: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(httpServer, {
      path: "/api/socket/io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 10000,
      transports: ["websocket", "polling"],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log("[SocketGateway] Socket.IO server initialized on path /api/socket/io");
    return this.io;
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }

  public setIO(io: SocketIOServer): void {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use((socket: Socket, next) => {
      try {
        const authSocket = socket as AuthenticatedSocket;
        const cookieHeader = socket.handshake.headers.cookie;
        const authPayload = socket.handshake.auth || {};

        let userId: string | null = null;
        let email: string | null = null;
        let displayName = authPayload.displayName || `Player_${socket.id.substring(0, 4)}`;
        let isGuest = true;

        // 1. Try to extract session from edubek_session cookie
        if (cookieHeader) {
          const match = cookieHeader.match(/edubek_session=([^;]+)/);
          if (match && match[1]) {
            try {
              const decoded = Buffer.from(decodeURIComponent(match[1]), "base64").toString("utf-8");
              const parsed = JSON.parse(decoded);
              if (parsed && parsed.userId) {
                userId = parsed.userId;
                email = parsed.email || null;
                displayName = parsed.name || parsed.email?.split("@")[0] || displayName;
                isGuest = false;
              }
            } catch {
              // Ignore cookie parse error, fallback to guest
            }
          }
        }

        // 2. Try auth.token if provided
        if (!userId && authPayload.token) {
          try {
            const decoded = Buffer.from(authPayload.token, "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            if (parsed && parsed.userId) {
              userId = parsed.userId;
              email = parsed.email || null;
              displayName = parsed.name || parsed.email?.split("@")[0] || displayName;
              isGuest = false;
            }
          } catch {
            // guest
          }
        }

        // 3. Guest player configuration
        if (!userId) {
          userId = authPayload.guestId || `guest_${socket.id.substring(0, 8)}`;
          isGuest = true;
        }

        authSocket.data = {
          userId,
          email,
          displayName,
          isGuest,
        };

        next();
      } catch (err) {
        next(new Error("Socket authentication error"));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const { userId, displayName, isGuest } = authSocket.data;

      console.log(`[SocketGateway] Client connected: socket=${socket.id}, user=${userId}, isGuest=${isGuest}`);

      // -----------------------------------------------------------------------
      // JOIN ROOM
      // -----------------------------------------------------------------------
      socket.on("room:join", async (payload: { code: string; displayName?: string; avatarUrl?: string }, callback) => {
        try {
          if (!checkActionRateLimit(socket.id, 20, 5000)) {
            socket.emit("error", { message: "Rate limit exceeded. Please slow down." });
            if (typeof callback === "function") callback({ success: false, error: "Rate limit exceeded" });
            return;
          }

          const { code, avatarUrl } = payload || {};
          const customName = payload?.displayName?.trim() || displayName || "Player";

          if (!code) {
            socket.emit("error", { message: "Room code is required" });
            if (typeof callback === "function") callback({ success: false, error: "Room code required" });
            return;
          }

          const room = this.roomManager.getRoomByCode(code);
          if (!room) {
            socket.emit("error", { message: "Room not found or expired" });
            if (typeof callback === "function") callback({ success: false, error: "Room not found" });
            return;
          }

          const { player, isNew } = room.addOrUpdatePlayer({
            userId,
            socketId: socket.id,
            displayName: customName,
            avatarUrl,
            isGuest,
          });

          authSocket.data.currentRoomId = room.roomId;
          authSocket.data.playerId = player.id;

          socket.join(room.roomId);

          const snapshot = room.getStateSnapshot(player.id);
          socket.emit("room:state", snapshot);

          // Broadcast player joined / reconnected to room
          socket.to(room.roomId).emit(isNew ? "player:joined" : "player:reconnected", {
            player: {
              playerId: player.id,
              displayName: player.displayName,
              avatarUrl: player.avatarUrl,
              score: player.score,
              isReady: player.isReady,
              role: player.role,
              status: player.status,
            },
            leaderboard: snapshot.leaderboard,
          });

          if (typeof callback === "function") {
            callback({ success: true, data: snapshot });
          }
        } catch (err: any) {
          socket.emit("error", { message: err.message || "Failed to join room" });
          if (typeof callback === "function") callback({ success: false, error: err.message });
        }
      });

      // -----------------------------------------------------------------------
      // READY STATE
      // -----------------------------------------------------------------------
      socket.on("room:ready", (payload: { ready: boolean }, callback) => {
        try {
          const roomId = authSocket.data.currentRoomId;
          const playerId = authSocket.data.playerId;
          if (!roomId || !playerId) {
            socket.emit("error", { message: "Not in an active room" });
            return;
          }

          const room = this.roomManager.getRoomById(roomId);
          if (!room) return;

          const player = room.setPlayerReady(playerId, Boolean(payload.ready));
          const snapshot = room.getStateSnapshot(playerId);

          this.io?.to(roomId).emit("player:ready", {
            playerId: player.id,
            isReady: player.isReady,
            canStart: snapshot.canStart,
            leaderboard: snapshot.leaderboard,
          });

          if (typeof callback === "function") callback({ success: true });
        } catch (err: any) {
          socket.emit("error", { message: err.message });
          if (typeof callback === "function") callback({ success: false, error: err.message });
        }
      });

      // -----------------------------------------------------------------------
      // START MATCH (Host only)
      // -----------------------------------------------------------------------
      socket.on("room:start", (_payload, callback) => {
        try {
          const roomId = authSocket.data.currentRoomId;
          const playerId = authSocket.data.playerId;
          if (!roomId || !playerId) {
            socket.emit("error", { message: "Not in an active room" });
            return;
          }

          const room = this.roomManager.getRoomById(roomId);
          if (!room) return;

          room.startCountdown(playerId);

          this.io?.to(roomId).emit("game:countdown", {
            durationSeconds: 3,
            message: "Match is starting...",
          });

          if (typeof callback === "function") callback({ success: true });
        } catch (err: any) {
          socket.emit("error", { message: err.message });
          if (typeof callback === "function") callback({ success: false, error: err.message });
        }
      });

      // -----------------------------------------------------------------------
      // SUBMIT ANSWER
      // -----------------------------------------------------------------------
      socket.on("question:answer", (submission: PlayerAnswerSubmission, callback) => {
        try {
          if (!checkActionRateLimit(socket.id, 10, 2000)) {
            socket.emit("error", { message: "Submission spam rejected" });
            if (typeof callback === "function") callback({ success: false, error: "Rate limit" });
            return;
          }

          const roomId = authSocket.data.currentRoomId;
          const playerId = authSocket.data.playerId;
          if (!roomId || !playerId) {
            socket.emit("error", { message: "Not in an active room" });
            return;
          }

          const room = this.roomManager.getRoomById(roomId);
          if (!room) return;

          const { record, isFirstSubmission } = room.submitAnswer(playerId, submission);

          // Return result to submitting player only (Anti-cheat: don't broadcast to other players yet)
          socket.emit("question:answer:ack", {
            success: true,
            isFirstSubmission,
            record: {
              roundNumber: record.roundNumber,
              isCorrect: record.isCorrect,
              pointsAwarded: record.pointsAwarded,
              speedBonus: record.speedBonus,
              streakBonus: record.streakBonus,
              responseMs: record.responseMs,
            },
          });

          if (typeof callback === "function") {
            callback({ success: true, pointsAwarded: record.pointsAwarded });
          }
        } catch (err: any) {
          socket.emit("error", { message: err.message || "Failed to submit answer" });
          if (typeof callback === "function") callback({ success: false, error: err.message });
        }
      });

      // -----------------------------------------------------------------------
      // NEXT QUESTION (Host only)
      // -----------------------------------------------------------------------
      socket.on("question:next", (_payload, callback) => {
        try {
          const roomId = authSocket.data.currentRoomId;
          const playerId = authSocket.data.playerId;
          if (!roomId || !playerId) return;

          const room = this.roomManager.getRoomById(roomId);
          if (!room) return;

          room.nextQuestion(playerId);
          if (typeof callback === "function") callback({ success: true });
        } catch (err: any) {
          socket.emit("error", { message: err.message });
          if (typeof callback === "function") callback({ success: false, error: err.message });
        }
      });

      // -----------------------------------------------------------------------
      // STATE REQUEST (Full snapshot sync)
      // -----------------------------------------------------------------------
      socket.on("room:state:request", (_payload, callback) => {
        const roomId = authSocket.data.currentRoomId;
        const playerId = authSocket.data.playerId;
        if (!roomId || !playerId) return;

        const room = this.roomManager.getRoomById(roomId);
        if (!room) return;

        const snapshot = room.getStateSnapshot(playerId);
        socket.emit("room:state", snapshot);
        if (typeof callback === "function") callback({ success: true, data: snapshot });
      });

      // -----------------------------------------------------------------------
      // LEAVE ROOM
      // -----------------------------------------------------------------------
      socket.on("room:leave", () => {
        const roomId = authSocket.data.currentRoomId;
        const playerId = authSocket.data.playerId;
        if (roomId && playerId) {
          const room = this.roomManager.getRoomById(roomId);
          if (room) {
            room.removePlayer(playerId);
            socket.leave(roomId);
          }
        }
        authSocket.data.currentRoomId = undefined;
        authSocket.data.playerId = undefined;
      });

      // -----------------------------------------------------------------------
      // DISCONNECT
      // -----------------------------------------------------------------------
      socket.on("disconnect", () => {
        console.log(`[SocketGateway] Client disconnected: socket=${socket.id}`);
        const roomId = authSocket.data.currentRoomId;
        if (roomId) {
          const room = this.roomManager.getRoomById(roomId);
          if (room) {
            room.handleSocketDisconnect(socket.id);
          }
        }
      });
    });
  }

  /**
   * Broadcasts an authoritative event to a specific room
   */
  public broadcastToRoom(roomId: string, eventName: string, data: any): void {
    if (this.io) {
      this.io.to(roomId).emit(eventName, data);
    }
  }
}
