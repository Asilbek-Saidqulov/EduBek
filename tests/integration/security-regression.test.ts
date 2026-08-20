/**
 * EduBek — Security regression tests.
 *
 * Verifies that the security fixes cannot regress:
 *   - Guest JWT secret separation (session JWT must NOT verify as guest)
 *   - Spectator namespace auth (anonymous sockets rejected)
 *   - REST guestAnswer answerLockAt enforcement
 *   - Search regex DoS prevention
 *   - Wallet credit atomicity (no lost-update)
 *   - resolveTargetUserId IDOR defense
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server as HTTPServer } from "node:http";
import type { Server as SocketIOServer } from "socket.io";
import { io as ioClient } from "socket.io-client";
import { setupRealtime, setRealtimeIo, type RealtimeServer } from "@/infra/realtime";
import { signGuestToken, verifyGuestToken, guestAnswer } from "@/features/live-session/guest-service";
import { signSessionToken } from "@/features/auth/auth.session";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";
import { buildContext } from "@/features/rbac/rbac.service";
import { db } from "@/lib/db";

const TEST_PORT = 3300 + Math.floor(Math.random() * 100);
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
  const userId = `sec-test-user-${Date.now()}`;
  await db.user.create({
    data: { id: userId, email: `${userId}@test.edubek.local`, username: userId, passwordHash: "test", name: "Sec Test User" },
  });
  testUser = { id: userId, email: `${userId}@test.edubek.local` };

  const sessionId = `sec-test-session-${Date.now()}`;
  await db.liveSession.create({
    data: {
      id: sessionId, title: "Sec Test Session",
      code: `SEC${Date.now().toString().slice(-6)}`, hostId: userId,
      gameMode: "classic", status: "in_progress", visibility: "public",
      currentRound: 1, totalRounds: 3, maxPlayers: 50, config: "{}",
    },
  });
  testSession = { id: sessionId, hostId: userId };

  const playerId = `sec-test-player-${Date.now()}`;
  await db.livePlayer.create({
    data: {
      id: playerId, sessionId, userId: null, isGuest: true,
      displayName: "Sec Guest", role: "player", status: "active", state: "{}",
    },
  });
  testPlayer = { id: playerId, sessionId };

  const roundId = `sec-test-round-${Date.now()}`;
  await db.liveRound.create({
    data: {
      id: roundId, sessionId, roundNumber: 1, questionId: null,
      questionSnapshot: JSON.stringify({
        question: "What is 2 + 2?", options: ["3", "4", "5", "6"],
        correctIndex: 1,
      }),
      questionDurationMs: 30000, startedAt: new Date(),
      answerLockAt: new Date(Date.now() + 30000),
      status: "active", resultsSnapshot: "{}",
    },
  });
  testRound = { id: roundId, sessionId };

  guestToken = await signGuestToken({
    playerId, sessionId, displayName: "Sec Guest", isGuest: true,
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

// ===========================================================================
// 1. Guest JWT secret isolation — session JWT must NOT verify as guest
// ===========================================================================

describe("Guest JWT secret isolation", () => {
  it("a session JWT is REJECTED by verifyGuestToken (wrong issuer/audience)", async () => {
    await expect(verifyGuestToken(sessionToken)).rejects.toThrow();
  });

  it("a valid guest token verifies successfully", async () => {
    const payload = await verifyGuestToken(guestToken);
    expect(payload.playerId).toBe(testPlayer.id);
    expect(payload.sessionId).toBe(testSession.id);
    expect(payload.isGuest).toBe(true);
  });
});

// ===========================================================================
// 2. Spectator namespace authentication
// ===========================================================================

describe("Spectator namespace auth", () => {
  it("rejects unauthenticated spectator connection", async () => {
    const socket = ioClient(`${TEST_ENDPOINT}/spectator`, {
      path: "/api/realtime", transports: ["websocket"],
      reconnection: false, timeout: 3000,
    });
    const result = await new Promise<string>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), 5000);
      socket.once("connect_error", (err: Error) => { clearTimeout(t); resolve(err.message); });
      socket.once("connect", () => { clearTimeout(t); reject(new Error("should not connect")); });
    });
    expect(result).toBe("unauthorized");
    socket.disconnect();
  });

  it("rejects spectator join for a session the user is not a member of", async () => {
    const socket = ioClient(`${TEST_ENDPOINT}/spectator`, {
      path: "/api/realtime", auth: { guestToken },
      transports: ["websocket"], reconnection: false, timeout: 5000,
    });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("connect timeout")), 5000);
      socket.once("connect", () => { clearTimeout(t); resolve(); });
      socket.once("connect_error", () => { clearTimeout(t); reject(new Error("should connect with valid guest token")); });
    });
    const result = await new Promise<{ ok: boolean }>((resolve) => {
      socket.emit("spectator:join", { sessionId: "wrong-session-id" }, (res: any) => resolve(res));
    });
    expect(result.ok).toBe(false);
    socket.disconnect();
  });
});

// ===========================================================================
// 3. REST guestAnswer answerLockAt enforcement
// ===========================================================================

describe("REST guestAnswer answerLockAt", () => {
  it("rejects answer submission after answerLockAt", async () => {
    const lockedRoundId = `sec-test-round-locked-${Date.now()}`;
    await db.liveRound.create({
      data: {
        id: lockedRoundId, sessionId: testSession.id, roundNumber: 2,
        questionId: null,
        questionSnapshot: JSON.stringify({
          question: "What is 3 + 3?", options: ["5", "6", "7", "8"],
          correctIndex: 1,
        }),
        questionDurationMs: 30000,
        startedAt: new Date(Date.now() - 60000),
        answerLockAt: new Date(Date.now() - 1000),
        status: "active", resultsSnapshot: "{}",
      },
    });
    await expect(
      guestAnswer({
        guestToken,
        roundId: lockedRoundId,
        answer: 1,
      }),
    ).rejects.toThrow(/locked/i);
    await db.liveRound.deleteMany({ where: { id: lockedRoundId } }).catch(() => {});
  });
});

// ===========================================================================
// 4. Search regex DoS — escaped metacharacters
// ===========================================================================

describe("Search regex DoS defense", () => {
  it("escaped metacharacters prevent catastrophic backtracking", async () => {
    const { search } = await import("@/features/search-platform");
    const start = Date.now();
    const results = search({
      query: "(a+)+!",
      matchType: "wildcard",
      limit: 10,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(results).toBeTruthy();
  });
});

// ===========================================================================
// 5. Wallet credit atomicity — no lost-update
// ===========================================================================

describe("Wallet credit atomicity", () => {
  it("concurrent credits do not lose increments (atomic increment)", async () => {
    const { credit } = await import("@/features/wallet/wallet.service");
    const userId = `sec-wallet-user-${Date.now()}`;
    await db.user.create({
      data: { id: userId, email: `${userId}@test.edubek.local`, username: userId, passwordHash: "test", name: "Wallet Test" },
    });
    await db.wallet.create({
      data: { userId, eduTokensBalance: 0, fiatBalance: 0, currency: "UZS" },
    });

    const credits = Array.from({ length: 5 }, () =>
      credit(userId, 10, "concurrent-test", "test", "concurrent"),
    );
    await Promise.all(credits);

    const wallet = await db.wallet.findUnique({ where: { userId } });
    expect(wallet?.eduTokensBalance).toBe(50);

    await db.eduTokenLedger.deleteMany({ where: { walletId: wallet!.id } }).catch(() => {});
    await db.wallet.deleteMany({ where: { userId } }).catch(() => {});
    await db.user.deleteMany({ where: { id: userId } }).catch(() => {});
  });
});

// ===========================================================================
// 6. resolveTargetUserId IDOR defense
// ===========================================================================

describe("resolveTargetUserId — IDOR defense", () => {
  it("regular user with no query → targets themselves", () => {
    const ctx = buildContext({ userId: "user-A", email: "a@test.local", platformRoles: ["user"] });
    expect(resolveTargetUserId(ctx, null)).toBe("user-A");
  });

  it("regular user with ?userId=other → IGNORED, targets themselves", () => {
    const ctx = buildContext({ userId: "user-A", email: "a@test.local", platformRoles: ["user"] });
    expect(resolveTargetUserId(ctx, "user-B")).toBe("user-A");
  });

  it("admin with ?userId=other → targets other (authorized)", () => {
    const ctx = buildContext({ userId: "admin-1", email: "admin@test.local", platformRoles: ["admin"] });
    expect(resolveTargetUserId(ctx, "user-B")).toBe("user-B");
  });

  it("anonymous context → returns undefined", () => {
    const ctx = buildContext({ platformRoles: [] });
    expect(resolveTargetUserId(ctx, "user-B")).toBeUndefined();
  });
});
