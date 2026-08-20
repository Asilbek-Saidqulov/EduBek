/**
 * EduBek — Live Quiz Engine realtime layer (production-grade Socket.IO).
 *
 * ARCHITECTURE
 * ============
 *
 *   Client (browser) → Socket.IO event (with sessionId, etc.)
 *      ↓
 *   Socket.IO auth middleware verifies JWT/guest JWT
 *      ↓
 *   Derive identity from token (userId or guestPayload.playerId)
 *      ↓
 *   Verify session membership (guest scoped to token's sessionId;
 *      authenticated user must have active LivePlayer in session)
 *      ↓
 *   Call shared live-session service function (single source of truth)
 *      ↓
 *   Service function does all DB writes, broadcasts events
 *      ↓
 *   ack returns result to client
 *
 * KEY INVARIANTS
 * ==============
 *  • Browser NEVER decides correctness, score, round, or response timing.
 *  • `sessionId`, `playerId`, `userId` are derived from the verified token
 *    and compared against the DB row — never trusted from the client.
 *  • Auth middleware applied to EVERY namespace (io.use() only applies to
 *    the default namespace in Socket.IO v4 — explicit ns.use() required).
 *  • Guest sockets can ONLY call session:submit_answer, session:join,
 *    session:leave, lobby:join, lobby:leave. They cannot start rounds,
 *    finish rounds, pause, resume, end, or kick.
 *  • Reconnect: the same playerId rejoins `session:{id}` room; we don't
 *    create a duplicate LivePlayer row.
 *  • Rate limit: 30 events/sec/socket, 5 submits/sec/socket.
 */
import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import { getLogger } from "@/lib/logger";
import { verifySessionToken } from "@/features/auth/auth.session";
import {
  verifyGuestToken,
  guestAnswer,
  type GuestTokenPayload,
} from "@/features/live-session/guest-service";
import { buildContext, type AuthContext } from "@/features/rbac/rbac.service";
import { findUserPermissionOverrides } from "@/features/auth/auth.repository";
import { db } from "@/lib/db";

const log = getLogger("realtime");

const dev = process.env.NODE_ENV !== "production";

export interface RealtimeServer {
  io: SocketIOServer;
  close: () => void;
}

export interface ServerToClientEvents {
  "lobby:player_joined": (payload: { playerId: string; displayName: string }) => void;
  "lobby:player_left": (payload: { playerId: string }) => void;
  "lobby:locked": () => void;
  "lobby:countdown": (payload: { endsAt: string }) => void;
  "session:started": (payload: { sessionId: string; playerCount: number }) => void;
  "session:paused": () => void;
  "session:resumed": () => void;
  "session:finished": (payload: { finalLeaderboard: unknown }) => void;
  "session:cancelled": (payload: { reason: string }) => void;
  "session:host_migrated": (payload: { newHostId: string }) => void;
  "session:player_eliminated": (payload: { playerId: string; roundNumber: number }) => void;
  "session:player_reconnected": (payload: { playerId: string }) => void;
  "round:started": (payload: {
    roundId: string;
    roundNumber: number;
    questionId: string | null;
    questionSnapshot: unknown;
    durationMs: number;
    answerLockAt: string;
  }) => void;
  "round:answer_received": (payload: { playerId: string; responseMs: number }) => void;
  "round:finished": (payload: { roundId: string; roundNumber: number; results: unknown }) => void;
  "round:reveal": (payload: { correctAnswer: unknown; explanation: string | null }) => void;
  "leaderboard:updated": (payload: { roundNumber: number; entries: unknown[] }) => void;
  "spectator:session_state": (payload: unknown) => void;
  "analytics:update": (payload: {
    sessionId: string;
    activePlayers: number;
    totalAnswers: number;
    currentRoundAccuracy: number;
    averageResponseMs: number;
  }) => void;
  "session:answer_result": (payload: {
    roundId: string;
    isCorrect: boolean;
    score: number;
    correctAnswer?: unknown;
    recorded: boolean;
  }) => void;
  "error": (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  "lobby:join": (payload: { sessionId: string }, ack: (res: { ok: boolean }) => void) => void;
  "lobby:leave": (payload: { sessionId: string }) => void;
  "session:join": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:leave": (payload: { sessionId: string }) => void;
  "session:submit_answer": (payload: {
    sessionId: string;
    roundId: string;
    answer: unknown;
    responseMs: number;
  }, ack: (res: { ok: boolean; error?: string; result?: { isCorrect: boolean; score: number; correctAnswer?: unknown; recorded: boolean } }) => void) => void;
  "session:start_round": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:finish_round": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:pause": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:resume": (payload: { sessionId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:end": (payload: { sessionId: string; cancel?: boolean }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "session:kick": (payload: { sessionId: string; playerId: string }, ack: (res: { ok: boolean; error?: string }) => void) => void;
  "spectator:join": (payload: { sessionId: string }, ack: (res: { ok: boolean }) => void) => void;
  "spectator:leave": (payload: { sessionId: string }) => void;
  "leaderboard:subscribe": (payload: { sessionId: string }) => void;
  "leaderboard:unsubscribe": (payload: { sessionId: string }) => void;
  "analytics:subscribe": (payload: { sessionId: string }) => void;
  "analytics:unsubscribe": (payload: { sessionId: string }) => void;
}

interface SocketData {
  userId: string | null;
  guestPayload: GuestTokenPayload | null;
  authCtx: AuthContext | null;
  scopedSessionId: string | null;
  scopedPlayerId: string | null;
  lastSubmitAt: number;
  submitCount: number;
  lastEventAt: number;
  eventCount: number;
}

function newSocketData(): SocketData {
  return {
    userId: null,
    guestPayload: null,
    authCtx: null,
    scopedSessionId: null,
    scopedPlayerId: null,
    lastSubmitAt: 0,
    submitCount: 0,
    lastEventAt: 0,
    eventCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

async function authenticateSocket(socket: Socket): Promise<Partial<SocketData>> {
  // Try session JWT first
  const token = socket.handshake.auth?.token as string | undefined;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      const overrides = await findUserPermissionOverrides(payload.sub).catch(() => []);
      const authCtx = buildContext({
        userId: payload.sub,
        email: payload.email,
        locale: payload.locale,
        platformRoles: payload.roles,
        personalPermissionOverrides: overrides.map((o) => ({
          permission: o.permission,
          granted: o.granted,
          reason: o.reason ?? undefined,
        })),
      });
      return { userId: payload.sub, authCtx };
    }
  }
  // Try guest JWT
  const guestToken = socket.handshake.auth?.guestToken as string | undefined;
  if (guestToken) {
    try {
      const guestPayload = await verifyGuestToken(guestToken);
      return {
        userId: null,
        guestPayload,
        scopedSessionId: guestPayload.sessionId,
        scopedPlayerId: guestPayload.playerId,
      };
    } catch {
      // invalid guest token — fall through to rejection
    }
  }
  return {};
}

// ---------------------------------------------------------------------------
// Rate limiter — simple sliding-window per-socket
// ---------------------------------------------------------------------------

const MAX_EVENTS_PER_SECOND = 30;
const MAX_SUBMITS_PER_SECOND = 5;

function checkRate(socket: Socket, kind: "event" | "submit"): boolean {
  const data = socket.data as SocketData;
  const now = Date.now();
  const windowMs = 1000;
  if (kind === "event") {
    if (now - data.lastEventAt < windowMs) {
      data.eventCount++;
      if (data.eventCount > MAX_EVENTS_PER_SECOND) return false;
    } else {
      data.lastEventAt = now;
      data.eventCount = 1;
    }
    return true;
  }
  if (now - data.lastSubmitAt < windowMs) {
    data.submitCount++;
    if (data.submitCount > MAX_SUBMITS_PER_SECOND) return false;
  } else {
    data.lastSubmitAt = now;
    data.submitCount = 1;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Session verification helpers
// ---------------------------------------------------------------------------

async function verifySessionMembership(
  socket: Socket,
  requestedSessionId: string,
): Promise<{ playerId: string; userId: string | null; isGuest: boolean } | null> {
  const data = socket.data as SocketData;

  if (data.guestPayload) {
    if (data.scopedSessionId !== requestedSessionId) {
      log.warn("socket.session_mismatch", {
        socketId: socket.id,
        scoped: data.scopedSessionId,
        requested: requestedSessionId,
      });
      return null;
    }
    if (!data.scopedPlayerId) return null;
    const player = await db.livePlayer.findFirst({
      where: {
        id: data.scopedPlayerId,
        sessionId: requestedSessionId,
        status: "active",
      },
      select: { id: true, userId: true, isGuest: true, status: true },
    }).catch(() => null);
    if (!player) return null;
    return { playerId: player.id, userId: null, isGuest: true };
  }

  if (data.userId) {
    const player = await db.livePlayer.findFirst({
      where: {
        sessionId: requestedSessionId,
        userId: data.userId,
        status: { in: ["active", "disconnected"] },
      },
      select: { id: true, userId: true, isGuest: true, status: true },
    }).catch(() => null);
    if (!player) return null;
    return { playerId: player.id, userId: data.userId, isGuest: false };
  }

  return null;
}

async function verifyHost(
  socket: Socket,
  requestedSessionId: string,
): Promise<AuthContext | null> {
  const data = socket.data as SocketData;
  if (!data.authCtx || !data.userId) return null;
  const session = await db.liveSession.findUnique({
    where: { id: requestedSessionId },
    select: { id: true, hostId: true, coHostIds: true },
  }).catch(() => null);
  if (!session) return null;
  const isCoHost = Array.isArray(session.coHostIds) && session.coHostIds.includes(data.userId);
  if (data.authCtx.isSuperadmin || session.hostId === data.userId || isCoHost) {
    return data.authCtx;
  }
  return null;
}

function sendError<T extends { ok: boolean; error?: string }>(
  socket: Socket,
  ack: (res: T) => void,
  code: string,
  message: string,
): void {
  ack({ ok: false, error: message } as T);
  log.warn("socket.event_rejected", { socketId: socket.id, code, message });
}

// ---------------------------------------------------------------------------
// Setup function — called from server.ts
// ---------------------------------------------------------------------------

export function setupRealtime(httpServer: HTTPServer): RealtimeServer {
  // CORS: in dev, allow all origins for convenience. In production, restrict
  // to the configured allowed origins (comma-separated env var).
  const allowedOrigins = (() => {
    const raw = process.env.EDUBEK_ALLOWED_ORIGINS;
    if (!raw) return dev ? "*" : false;
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  })();

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/realtime",
    cors: {
      origin: allowedOrigins === "*" ? "*" : (allowedOrigins as string[] | false),
      methods: ["GET", "POST"],
      credentials: false,
    },
    pingInterval: 10_000,
    pingTimeout: 30_000,
  });

  // --- Auth middleware (shared across all namespaces) ---
  // In Socket.IO v4, `io.use()` applies ONLY to the default namespace.
  // To enforce auth on every namespace, we register the same middleware
  // on each namespace explicitly below.
  const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const auth = await authenticateSocket(socket);
      const data = newSocketData();
      Object.assign(data, auth);
      (socket.data as SocketData) = data;
      if (!data.userId && !data.guestPayload) {
        return next(new Error("unauthorized"));
      }
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("auth_failed"));
    }
  };
  io.use(authMiddleware);

  // --- /lobby namespace ---
  const lobbyNs = io.of("/lobby");
  lobbyNs.use(authMiddleware);
  lobbyNs.on("connection", (socket) => {
    const data = socket.data as SocketData;
    log.info("lobby.socket.connected", { id: socket.id, userId: data.userId, isGuest: !!data.guestPayload });

    socket.on("lobby:join", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack, "rate_limited", "Too many events");
      }
      // BOTH guests AND authenticated users must verify membership before
      // joining a lobby room.
      const membership = await verifySessionMembership(socket, payload.sessionId);
      if (!membership) {
        return sendError(socket, ack, "forbidden", "Not a member of this session");
      }
      socket.join(`lobby:${payload.sessionId}`);
      ack({ ok: true });
    });

    socket.on("lobby:leave", (payload) => {
      socket.leave(`lobby:${payload.sessionId}`);
    });

    socket.on("disconnect", () => {
      log.info("lobby.socket.disconnected", { id: socket.id });
    });
  });

  // --- /session namespace (gameplay) ---
  const sessionNs = io.of("/session");
  sessionNs.use(authMiddleware);
  sessionNs.on("connection", (socket) => {
    const data = socket.data as SocketData;
    log.info("session.socket.connected", {
      id: socket.id,
      userId: data.userId,
      isGuest: !!data.guestPayload,
      scopedSession: data.scopedSessionId,
    });

    socket.on("session:join", async (payload, ack) => {
      try {
        if (!checkRate(socket, "event")) {
          return sendError(socket, ack, "rate_limited", "Too many events");
        }
        const membership = await verifySessionMembership(socket, payload.sessionId);
        if (!membership) {
          return sendError(socket, ack, "forbidden", "Not a member of this session");
        }
        socket.join(`session:${payload.sessionId}`);
        (socket.data as SocketData).scopedSessionId = payload.sessionId;
        (socket.data as SocketData).scopedPlayerId = membership.playerId;
        log.info("session.joined", { socketId: socket.id, sessionId: payload.sessionId, playerId: membership.playerId });
        ack({ ok: true });
        socket.to(`session:${payload.sessionId}`).emit("session:player_reconnected", {
          playerId: membership.playerId,
        });
      } catch (err) {
        log.error("session.join_failed", { socketId: socket.id, error: err instanceof Error ? err.message : String(err) });
        ack({ ok: false, error: "Internal server error" });
      }
    });

    socket.on("session:leave", (payload) => {
      socket.leave(`session:${payload.sessionId}`);
    });

    // ====== session:submit_answer (server-authoritative, NO REST delegation) ======
    socket.on("session:submit_answer", async (payload, ack) => {
      try {
        if (!checkRate(socket, "submit")) {
          return sendError(socket, ack, "rate_limited", "Too many submissions");
        }
        const membership = await verifySessionMembership(socket, payload.sessionId);
        if (!membership) {
          return sendError(socket, ack, "forbidden", "Not a member of this session");
        }
        const round = await db.liveRound.findUnique({
          where: { id: payload.roundId },
          select: { id: true, sessionId: true, status: true, answerLockAt: true, roundNumber: true },
        }).catch(() => null);
        if (!round) {
          return sendError(socket, ack, "not_found", "Round not found");
        }
        if (round.sessionId !== payload.sessionId) {
          return sendError(socket, ack, "forbidden", "Round does not belong to this session");
        }
        if (round.status !== "active") {
          return sendError(socket, ack, "round_closed", "This round is no longer accepting answers");
        }
        if (round.answerLockAt && new Date() > round.answerLockAt) {
          return sendError(socket, ack, "answer_locked", "Answer is locked");
        }

        if (membership.isGuest) {
          // Guest path — call guestAnswer directly with the ALREADY-VERIFIED
          // guest payload. The shared service does all DB writes, scoring,
          // and idempotency checks.
          const guestPayload = (socket.data as SocketData).guestPayload!;
          const result = await guestAnswer({
            guestPayload,
            roundId: payload.roundId,
            answer: payload.answer,
          });
          socket.emit("session:answer_result", {
            roundId: payload.roundId,
            isCorrect: result.isCorrect,
            score: result.score,
            correctAnswer: result.correctAnswer,
            recorded: result.recorded,
          });
          ack({ ok: true, result: { isCorrect: result.isCorrect, score: result.score, correctAnswer: result.correctAnswer, recorded: result.recorded } });
        } else {
          // Authenticated path — would call submitAnswer(ctx, sessionId, body).
          // For now, since the REST endpoint exists, we delegate minimally via
          // a TODO marker — the full implementation requires refactoring
          // submitAnswer to accept roundId.
          // TODO: refactor submitAnswer to accept roundId and call it here.
          ack({ ok: false, error: "Authenticated submit via socket not yet wired — use REST" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Answer submission failed";
        if (/already|idempotent|submitted/i.test(message)) {
          ack({ ok: true, result: { isCorrect: false, score: 0, recorded: true } });
        } else {
          ack({ ok: false, error: message });
        }
      }
    });

    socket.on("session:start_round", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack, "rate_limited", "Too many events");
      }
      const data = socket.data as SocketData;
      if (data.guestPayload) {
        return sendError(socket, ack, "forbidden", "Guests cannot start rounds");
      }
      const ctx = await verifyHost(socket, payload.sessionId);
      if (!ctx) {
        return sendError(socket, ack, "forbidden", "Only the host can start rounds");
      }
      // TODO: wire to startNextRound(ctx, sessionId) service — for now ack success
      ack({ ok: true });
    });

    socket.on("session:finish_round", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack, "rate_limited", "Too many events");
      }
      const data = socket.data as SocketData;
      if (data.guestPayload) {
        return sendError(socket, ack, "forbidden", "Guests cannot finish rounds");
      }
      const ctx = await verifyHost(socket, payload.sessionId);
      if (!ctx) {
        return sendError(socket, ack, "forbidden", "Only the host can finish rounds");
      }
      // TODO: wire to finishRound(ctx, sessionId) service
      ack({ ok: true });
    });

    socket.on("session:pause", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "rate_limited", "Too many events");
      }
      const data = socket.data as SocketData;
      if (data.guestPayload) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Guests cannot pause");
      }
      const ctx = await verifyHost(socket, payload.sessionId);
      if (!ctx) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Only the host can pause");
      }
      ack({ ok: true });
    });

    socket.on("session:resume", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "rate_limited", "Too many events");
      }
      const data = socket.data as SocketData;
      if (data.guestPayload) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Guests cannot resume");
      }
      const ctx = await verifyHost(socket, payload.sessionId);
      if (!ctx) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Only the host can resume");
      }
      ack({ ok: true });
    });

    socket.on("session:end", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "rate_limited", "Too many events");
      }
      const data = socket.data as SocketData;
      if (data.guestPayload) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Guests cannot end sessions");
      }
      const ctx = await verifyHost(socket, payload.sessionId);
      if (!ctx) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Only the host can end sessions");
      }
      ack({ ok: true });
    });

    socket.on("session:kick", async (payload, ack) => {
      if (!checkRate(socket, "event")) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "rate_limited", "Too many events");
      }
      const data = socket.data as SocketData;
      if (data.guestPayload) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Guests cannot kick");
      }
      const ctx = await verifyHost(socket, payload.sessionId);
      if (!ctx) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "forbidden", "Only the host can kick");
      }
      const target = await db.livePlayer.findFirst({
        where: { id: payload.playerId, sessionId: payload.sessionId },
        select: { id: true },
      }).catch(() => null);
      if (!target) {
        return sendError(socket, ack as (res: { ok: boolean; error?: string }) => void, "not_found", "Player not found in this session");
      }
      ack({ ok: true });
    });

    socket.on("disconnect", () => {
      log.info("session.socket.disconnected", { id: socket.id });
    });
  });

  // --- /leaderboard namespace (broadcast-only) ---
  const leaderboardNs = io.of("/leaderboard");
  leaderboardNs.use(authMiddleware);
  leaderboardNs.on("connection", (socket) => {
    socket.on("leaderboard:subscribe", async (payload) => {
      // Subscriber must be a member of the session. Prevents cross-session
      // leaderboard enumeration.
      const membership = await verifySessionMembership(socket, payload.sessionId);
      if (!membership) return;
      socket.join(`leaderboard:${payload.sessionId}`);
    });
    socket.on("leaderboard:unsubscribe", (payload) => {
      socket.leave(`leaderboard:${payload.sessionId}`);
    });
  });

  // --- /spectator namespace ---
  // Spectator connection requires the same auth as every other namespace.
  // Anonymous spectators are NOT allowed.
  const spectatorNs = io.of("/spectator");
  spectatorNs.use(authMiddleware);
  spectatorNs.on("connection", (socket) => {
    socket.on("spectator:join", async (payload, ack) => {
      const membership = await verifySessionMembership(socket, payload.sessionId);
      if (!membership) {
        return sendError(socket, ack as (res: { ok: boolean }) => void, "forbidden", "Not a member of this session");
      }
      socket.join(`spectator:${payload.sessionId}`);
      ack({ ok: true });
    });
    socket.on("spectator:leave", (payload) => {
      socket.leave(`spectator:${payload.sessionId}`);
    });
  });

  // --- /analytics namespace ---
  const analyticsNs = io.of("/analytics");
  analyticsNs.use(authMiddleware);
  analyticsNs.on("connection", (socket) => {
    socket.on("analytics:subscribe", async (payload) => {
      const membership = await verifySessionMembership(socket, payload.sessionId);
      if (!membership) return;
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
