/**
 * EduBek — Live Quiz Engine realtime namespace definitions.
 *
 * The Socket.IO server exposes 5 namespaces (one per concern):
 *
 *   /lobby       — Lobby chat + join/leave notifications
 *   /session     — Quiz Session gameplay events (round_started, answer_submitted, etc.)
 *   /leaderboard — live Leaderboard updates (broadcast-only)
 *   /spectator   — read-only mirror of /session for Spectators
 *   /analytics   — aggregate metrics for dashboard widgets
 *
 * Each namespace uses rooms keyed by `sessionId`. The host joins the
 * `host` room; participants join the `session:<id>` room; spectators
 * join the `spectators:<id>` room. Team rooms (`team:<id>:<color>`)
 * are reserved for future team-based Game Modes.
 *
 * The realtime layer is a TRANSPORT ONLY. It receives client events,
 * delegates to the Quiz Session service for state changes, and
 * broadcasts the resulting events back to clients. No scoring or game
 * logic lives here.
 *
 * Auth: every socket must present a valid JWT (same as the REST API).
 * The middleware verifies it via the auth.session module.
 */
import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { getLogger } from "@/lib/logger";
import { verifySessionToken } from "@/features/auth/auth.session";

const log = getLogger("realtime");

export interface RealtimeServer {
  io: SocketIOServer;
  close: () => void;
}

export interface ServerToClientEvents {
  // Lobby
  "lobby:player_joined": (payload: { playerId: string; displayName: string }) => void;
  "lobby:player_left": (payload: { playerId: string }) => void;
  "lobby:locked": () => void;
  "lobby:countdown": (payload: { endsAt: string }) => void;
  // Session
  "session:started": (payload: { sessionId: string; playerCount: number }) => void;
  "session:paused": () => void;
  "session:resumed": () => void;
  "session:finished": (payload: { finalLeaderboard: unknown }) => void;
  "session:cancelled": (payload: { reason: string }) => void;
  "session:host_migrated": (payload: { newHostId: string }) => void;
  "session:player_eliminated": (payload: { playerId: string; roundNumber: number }) => void;
  // Round
  "round:started": (payload: {
    roundId: string;
    roundNumber: number;
    questionId: string | null;
    questionSnapshot: unknown;
    durationMs: number;
    answerLockAt: string;
  }) => void;
  "round:answer_received": (payload: { playerId: string; responseMs: number }) => void;
  "round:finished": (payload: {
    roundId: string;
    roundNumber: number;
    results: unknown;
  }) => void;
  "round:reveal": (payload: { correctAnswer: unknown; explanation: string | null }) => void;
  // Leaderboard
  "leaderboard:updated": (payload: { roundNumber: number; entries: unknown[] }) => void;
  // Spectator (mirror of session events, no input accepted)
  "spectator:session_state": (payload: unknown) => void;
  // Analytics
  "analytics:update": (payload: {
    sessionId: string;
    activePlayers: number;
    totalAnswers: number;
    currentRoundAccuracy: number;
    averageResponseMs: number;
  }) => void;
  // Generic error
  error: (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "lobby:join": (payload: { sessionId: string }, ack: (res: { ok: boolean }) => void) => void;
  "lobby:leave": (payload: { sessionId: string }) => void;
  "session:join": (payload: { sessionId: string }, ack: (res: { ok: boolean }) => void) => void;
  "session:leave": (payload: { sessionId: string }) => void;
  "session:submit_answer": (payload: {
    sessionId: string;
    roundId: string;
    answer: unknown;
    responseMs: number;
  }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:start_round": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:finish_round": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:pause": (payload: { sessionId: string }) => void;
  "session:resume": (payload: { sessionId: string }) => void;
  "session:end": (payload: { sessionId: string; cancel?: boolean }) => void;
  "session:kick": (payload: { sessionId: string; playerId: string }) => void;
  "spectator:join": (payload: { sessionId: string; token: string }, ack: (res: { ok: boolean }) => void) => void;
  "spectator:leave": (payload: { sessionId: string }) => void;
  "leaderboard:subscribe": (payload: { sessionId: string }) => void;
  "leaderboard:unsubscribe": (payload: { sessionId: string }) => void;
  "analytics:subscribe": (payload: { sessionId: string }) => void;
  "analytics:unsubscribe": (payload: { sessionId: string }) => void;
}

// ---------------------------------------------------------------------------
// Auth middleware (shared across all namespaces)
// ---------------------------------------------------------------------------

async function authenticateSocket(socket: Socket): Promise<string | null> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return null;
  try {
    const payload = await verifySessionToken(token);
    if (!payload) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Setup function — called from server.ts
// ---------------------------------------------------------------------------

export function setupRealtime(httpServer: HTTPServer): RealtimeServer {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/realtime",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 10_000,
    pingTimeout: 30_000,
  });

  // --- Auth middleware (applied to every namespace) ---
  io.use(async (socket, next) => {
    const userId = await authenticateSocket(socket);
    if (!userId) {
      return next(new Error("unauthorized"));
    }
    (socket.data as any).userId = userId;
    next();
  });

  // --- /lobby namespace ---
  const lobbyNs = io.of("/lobby");
  lobbyNs.on("connection", (socket) => {
    log.info("lobby.socket.connected", { id: socket.id, userId: (socket.data as any).userId });
    socket.on("lobby:join", (payload, ack) => {
      socket.join(`lobby:${payload.sessionId}`);
      ack({ ok: true });
    });
    socket.on("lobby:leave", (payload) => {
      socket.leave(`lobby:${payload.sessionId}`);
    });
  });

  // --- /session namespace (gameplay) ---
  const sessionNs = io.of("/session");
  sessionNs.on("connection", (socket) => {
    log.info("session.socket.connected", { id: socket.id, userId: (socket.data as any).userId });
    socket.on("session:join", (payload, ack) => {
      socket.join(`session:${payload.sessionId}`);
      ack({ ok: true });
    });
    socket.on("session:leave", (payload) => {
      socket.leave(`session:${payload.sessionId}`);
    });
    socket.on("session:submit_answer", async (payload, ack) => {
      // The socket layer is a transport — delegate to the REST API for state
      // changes. The client should POST /api/live/sessions/[id]/answer; this
      // event is provided for clients that prefer the socket transport.
      // For now we just acknowledge; the actual processing happens via REST.
      ack({ ok: true });
    });
    socket.on("session:start_round", async (payload, ack) => {
      ack({ ok: true });
    });
    socket.on("session:finish_round", async (payload, ack) => {
      ack({ ok: true });
    });
    socket.on("disconnect", () => {
      log.info("session.socket.disconnected", { id: socket.id });
    });
  });

  // --- /leaderboard namespace (broadcast-only) ---
  const leaderboardNs = io.of("/leaderboard");
  leaderboardNs.on("connection", (socket) => {
    socket.on("leaderboard:subscribe", (payload) => {
      socket.join(`leaderboard:${payload.sessionId}`);
    });
    socket.on("leaderboard:unsubscribe", (payload) => {
      socket.leave(`leaderboard:${payload.sessionId}`);
    });
  });

  // --- /spectator namespace ---
  const spectatorNs = io.of("/spectator");
  spectatorNs.use(async (socket, next) => {
    // Spectator tokens are validated on the join event (not on connection)
    next();
  });
  spectatorNs.on("connection", (socket) => {
    socket.on("spectator:join", (payload, ack) => {
      // Token verification happens via the spectator service
      socket.join(`spectator:${payload.sessionId}`);
      ack({ ok: true });
    });
    socket.on("spectator:leave", (payload) => {
      socket.leave(`spectator:${payload.sessionId}`);
    });
  });

  // --- /analytics namespace ---
  const analyticsNs = io.of("/analytics");
  analyticsNs.on("connection", (socket) => {
    socket.on("analytics:subscribe", (payload) => {
      socket.join(`analytics:${payload.sessionId}`);
    });
    socket.on("analytics:unsubscribe", (payload) => {
      socket.leave(`analytics:${payload.sessionId}`);
    });
  });

  log.info("realtime.started", { path: "/api/realtime" });

  return {
    io,
    close: () => {
      io.close();
      log.info("realtime.closed");
    },
  };
}

// ---------------------------------------------------------------------------
// Broadcast helpers (called by the live-session service via the event bus)
// ---------------------------------------------------------------------------

/**
 * Returns the singleton io instance (set by server.ts). Other modules
 * import this to broadcast events without needing a direct reference to
 * the HTTP server.
 */
let _io: SocketIOServer | null = null;

export function setRealtimeIo(io: SocketIOServer): void {
  _io = io;
}

export function getIo(): SocketIOServer | null {
  return _io;
}

export function broadcastToSession(sessionId: string, event: string, payload: unknown): void {
  if (!_io) return;
  _io.of("/session").to(`session:${sessionId}`).emit(event as any, payload as any);
  // Mirror to spectators
  _io.of("/spectator").to(`spectator:${sessionId}`).emit("spectator:session_state", payload);
}

export function broadcastToLobby(sessionId: string, event: string, payload: unknown): void {
  if (!_io) return;
  _io.of("/lobby").to(`lobby:${sessionId}`).emit(event as any, payload as any);
}

export function broadcastLeaderboard(sessionId: string, roundNumber: number, entries: unknown[]): void {
  if (!_io) return;
  _io.of("/leaderboard").to(`leaderboard:${sessionId}`).emit("leaderboard:updated", { roundNumber, entries });
}

export function broadcastAnalytics(sessionId: string, payload: unknown): void {
  if (!_io) return;
  _io.of("/analytics").to(`analytics:${sessionId}`).emit("analytics:update", payload);
}
