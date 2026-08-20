/**
 * EduBek — Socket.IO integration tests (real server, no mocks).
 *
 * Verifies end-to-end authentication, session isolation, event handling,
 * and server-authoritative answer processing.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server as HTTPServer } from "node:http";
import type { Server as SocketIOServer } from "socket.io";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { setupRealtime, setRealtimeIo, type RealtimeServer } from "@/infra/realtime";
import { signGuestToken } from "@/features/live-session/guest-service";
import { signSessionToken } from "@/features/auth/auth.session";
import { db } from "@/lib/db";

const TEST_PORT = 3100 + Math.floor(Math.random() * 100);
const TEST_ENDPOINT = `http://127.0.0.1:${TEST_PORT}`;

let httpServer: HTTPServer;
let realtimeServer: RealtimeServer;
let ioServer: SocketIOServer;
let testUser: { id: string; email: string };
let testSession: { id: string; hostId: string };
let testPlayer: { id: string; sessionId: string };
let testRound: { id: string; sessionId: string };
let guestToken: string;
let sessionToken: string;

async function setupFixtures() {
  const userId = `socket-test-user-${Date.now()}`;
  await db.user.create({
    data: { id: userId, email: `${userId}@test.edubek.local`, username: userId, passwordHash: "test", name: "Socket Test User" },
  });
  testUser = { id: userId, email: `${userId}@test.edubek.local` };

  const sessionId = `socket-test-session-${Date.now()}`;
  await db.liveSession.create({
    data: {
      id: sessionId, title: "Socket Test Session",
      code: `TST${Date.now().toString().slice(-6)}`, hostId: userId,
      gameMode: "classic", status: "in_progress", visibility: "public",
      currentRound: 1, totalRounds: 3, maxPlayers: 50, config: "{}",
    },
  });
  testSession = { id: sessionId, hostId: userId };

  const playerId = `socket-test-player-${Date.now()}`;
  await db.livePlayer.create({
    data: {
      id: playerId, sessionId, userId: null, isGuest: true,
      displayName: "Guest Tester", role: "player", status: "active", state: "{}",
    },
  });
  testPlayer = { id: playerId, sessionId };

  const roundId = `socket-test-round-${Date.now()}`;
  await db.liveRound.create({
    data: {
      id: roundId, sessionId, roundNumber: 1, questionId: null,
      questionSnapshot: JSON.stringify({
        question: "What is 2 + 2?", options: ["3", "4", "5", "6"],
        correctIndex: 1, explanation: "2 + 2 = 4",
      }),
      questionDurationMs: 30000, startedAt: new Date(),
      answerLockAt: new Date(Date.now() + 30000),
      status: "active", resultsSnapshot: "{}",
    },
  });
  testRound = { id: roundId, sessionId };

  guestToken = await signGuestToken({
    playerId, sessionId, displayName: "Guest Tester", isGuest: true,
  });
  sessionToken = await signSessionToken({
    sub: userId, email: testUser.email, roles: ["student"],
  });
}

async function teardownFixtures() {
  if (testRound) await db.liveAnswer.deleteMany({ where: { roundId: testRound.id } }).catch(() => {});
  if (testRound) await db.liveRound.deleteMany({ where: { id: testRound.id } }).catch(() => {});
  if (testPlayer) await db.livePlayer.deleteMany({ where: { id: testPlayer.id } }).catch(() => {});
  if (testSession) await db.liveSession.deleteMany({ where: { id: testSession.id } }).catch(() => {});
  if (testUser) await db.user.deleteMany({ where: { id: testUser.id } }).catch(() => {});
}

beforeAll(async () => {
  await setupFixtures();
  httpServer = createServer();
  realtimeServer = setupRealtime(httpServer);
  ioServer = realtimeServer.io;
  setRealtimeIo(ioServer);
  await new Promise<void>((resolve) => httpServer.listen(TEST_PORT, "127.0.0.1", () => resolve()));
});

afterAll(async () => {
  if (ioServer) await new Promise<void>((resolve) => ioServer.close(() => resolve()));
  if (httpServer) await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await teardownFixtures();
  await db.$disconnect();
});

function waitForConnect(socket: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("connect timeout")), 5000);
    socket.once("connect", () => { clearTimeout(t); resolve(); });
    socket.once("connect_error", (err: Error) => { clearTimeout(t); reject(err); });
  });
}

function waitForConnectError(socket: ClientSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), 5000);
    socket.once("connect_error", (err: Error) => { clearTimeout(t); resolve(err.message); });
    socket.once("connect", () => { clearTimeout(t); reject(new Error("should not connect")); });
  });
}

describe("Socket.IO integration", () => {
  describe("Authentication", () => {
    it("rejects connection with no auth", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", transports: ["websocket"],
        reconnection: false, timeout: 3000,
      });
      await expect(waitForConnectError(socket)).resolves.toBe("unauthorized");
      socket.disconnect();
    });

    it("rejects connection with invalid guest token", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken: "invalid.token.here" },
        transports: ["websocket"], reconnection: false, timeout: 3000,
      });
      await expect(waitForConnectError(socket)).resolves.toBe("unauthorized");
      socket.disconnect();
    });

    it("rejects connection with invalid session token", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { token: "invalid.session.token" },
        transports: ["websocket"], reconnection: false, timeout: 3000,
      });
      await expect(waitForConnectError(socket)).resolves.toBe("unauthorized");
      socket.disconnect();
    });

    it("accepts valid guest token", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      expect(socket.connected).toBe(true);
      socket.disconnect();
    });

    it("accepts valid session token", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { token: sessionToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      expect(socket.connected).toBe(true);
      socket.disconnect();
    });
  });

  describe("Session isolation", () => {
    it("guest can only join their own session", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      const result = await new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ack timeout")), 5000);
        socket.emit("session:join", { sessionId: "wrong-session-id" }, (res: any) => {
          clearTimeout(t); resolve(res);
        });
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
      socket.disconnect();
    });

    it("guest can join their own session", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      const result = await new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ack timeout")), 5000);
        socket.emit("session:join", { sessionId: testSession.id }, (res: any) => {
          clearTimeout(t); resolve(res);
        });
      });
      expect(result.ok).toBe(true);
      socket.disconnect();
    });
  });

  describe("Answer submission", () => {
    it("guest submits correct answer and gets server-authoritative result", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      await new Promise<void>((resolve) => {
        socket.emit("session:join", { sessionId: testSession.id }, () => resolve());
      });

      const result = await new Promise<{ ok: boolean; result?: { isCorrect: boolean; score: number; recorded: boolean } }>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ack timeout")), 5000);
        socket.emit("session:submit_answer", {
          sessionId: testSession.id, roundId: testRound.id,
          answer: 1, responseMs: 1500,
        }, (res: any) => { clearTimeout(t); resolve(res); });
      });

      expect(result.ok).toBe(true);
      expect(result.result).toBeTruthy();
      expect(result.result!.isCorrect).toBe(true);
      expect(result.result!.score).toBeGreaterThan(0);
      expect(result.result!.recorded).toBe(true);
      socket.disconnect();
    });

    it("guest cannot submit answer for a different session's round", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      const result = await new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ack timeout")), 5000);
        socket.emit("session:submit_answer", {
          sessionId: "wrong-session-id", roundId: testRound.id,
          answer: 1, responseMs: 1000,
        }, (res: any) => { clearTimeout(t); resolve(res); });
      });
      expect(result.ok).toBe(false);
      socket.disconnect();
    });
  });

  describe("Host-only events", () => {
    it("guest cannot start a round", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      const result = await new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ack timeout")), 5000);
        socket.emit("session:start_round", { sessionId: testSession.id }, (res: any) => {
          clearTimeout(t); resolve(res);
        });
      });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/guest/i);
      socket.disconnect();
    });

    it("guest cannot pause the session", async () => {
      const socket = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket);
      const result = await new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ack timeout")), 5000);
        socket.emit("session:pause", { sessionId: testSession.id }, (res: any) => {
          clearTimeout(t); resolve(res);
        });
      });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/guest/i);
      socket.disconnect();
    });
  });

  describe("Reconnect", () => {
    it("reconnecting guest does not create duplicate LivePlayer row", async () => {
      const beforeCount = await db.livePlayer.count({ where: { id: testPlayer.id } });
      expect(beforeCount).toBe(1);

      const socket1 = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket1);
      await new Promise<void>((resolve) => {
        socket1.emit("session:join", { sessionId: testSession.id }, () => resolve());
      });
      socket1.disconnect();

      const socket2 = ioClient(`${TEST_ENDPOINT}/session`, {
        path: "/api/realtime", auth: { guestToken },
        transports: ["websocket"], reconnection: false, timeout: 5000,
      });
      await waitForConnect(socket2);
      await new Promise<void>((resolve) => {
        socket2.emit("session:join", { sessionId: testSession.id }, () => resolve());
      });
      socket2.disconnect();

      const afterCount = await db.livePlayer.count({ where: { id: testPlayer.id } });
      expect(afterCount).toBe(1);
    });
  });
});
