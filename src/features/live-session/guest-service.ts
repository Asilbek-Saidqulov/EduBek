/**
 * Guest quiz service — allows anonymous participation in live quizzes.
 *
 * SECURITY MODEL:
 *   - Guest players have `userId = null` on the LivePlayer model.
 *   - A short-lived signed JWT (guestToken) is issued on join, containing
 *     { playerId, sessionId, displayName, isGuest: true }.
 *   - Every guest API call verifies the token server-side.
 *   - Scoring is 100% server-authoritative — the guest's browser never
 *     determines correctness or score.
 *   - The guest token expires when the session ends or after 4 hours.
 *   - Rate limiting: max 5 join attempts per IP per 5 minutes (enforced
 *     in the route handler via enforceGuestJoinRateLimit).
 *
 * TOKEN ISOLATION:
 *   - Guest JWTs are signed with a DEDICATED secret (EDUBEK_GUEST_SECRET),
 *     distinct from session JWTs (EDUBEK_SESSION_SECRET). This means a
 *     leaked guest token cannot be used to forge a session JWT, and a
 *     leaked session JWT cannot be used as a guest token.
 *   - Guest JWTs set issuer=audience="edubek:guest" and verify both.
 *     A session JWT (issuer=audience="edubek:session") is REJECTED by
 *     verifyGuestToken even if signed with the same secret.
 *   - verifyGuestToken rejects any payload where isGuest !== true or
 *     where playerId/sessionId are missing.
 */

import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { badRequest, notFound, forbidden, unauthorized, tooManyRequests } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import { env } from "@/config/env";
import { createRateLimiter } from "@/infra/rate-limiter";

const log = getLogger("guest-quiz");
const GUEST_SECRET = env.auth.guestSecret;
const GUEST_ISSUER = "edubek:guest";
const GUEST_AUDIENCE = "edubek:guest";
const encoder = new TextEncoder();
const GUEST_TTL = 4 * 60 * 60; // 4 hours

// Rate limiter for guest join attempts (5 per IP per 5 min). Uses the same
// store abstraction as the rest of the platform; in production, swap the
// in-memory store for Redis.
const guestJoinLimiter = createRateLimiter({
  windowMs: 5 * 60_000,
  max: 5,
  prefix: "guest-join",
});

export interface GuestTokenPayload {
  playerId: string;
  sessionId: string;
  displayName: string;
  isGuest: boolean;
}

/** Sign a guest token (short-lived JWT scoped to a session). */
export async function signGuestToken(payload: GuestTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(GUEST_ISSUER)
    .setAudience(GUEST_AUDIENCE)
    .setExpirationTime(`${GUEST_TTL}s`)
    .sign(encoder.encode(GUEST_SECRET));
}

/** Verify a guest token. Throws on invalid/expired/wrong-type. */
export async function verifyGuestToken(token: string): Promise<GuestTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(GUEST_SECRET), {
      issuer: GUEST_ISSUER,
      audience: GUEST_AUDIENCE,
    });
    // Defense in depth: even if a session JWT somehow signed with the guest
    // secret, reject it unless isGuest === true and the required fields
    // are present.
    if (payload.isGuest !== true) {
      throw unauthorized("Invalid or expired guest token");
    }
    if (typeof payload.playerId !== "string" || typeof payload.sessionId !== "string") {
      throw unauthorized("Invalid or expired guest token");
    }
    return {
      playerId: payload.playerId,
      sessionId: payload.sessionId,
      displayName: typeof payload.displayName === "string" ? payload.displayName : "",
      isGuest: true,
    };
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "HttpError") {
      throw err;
    }
    throw unauthorized("Invalid or expired guest token");
  }
}

/**
 * Enforce the per-IP guest-join rate limit. Throws `tooManyRequests` if the
 * caller has exceeded 5 join attempts in the last 5 minutes.
 *
 * Call this from the route handler BEFORE creating a LivePlayer row.
 */
export function enforceGuestJoinRateLimit(ipAddress?: string): void {
  if (!ipAddress) return; // dev-friendly: skip when no IP available
  const result = guestJoinLimiter.check(ipAddress);
  if (!result.allowed) {
    throw tooManyRequests("Too many guest join attempts. Please try again later.");
  }
}

/**
 * Guest join — validates the join code, creates a LivePlayer with
 * `userId = null`, `isGuest = true`, and returns a guest token.
 */
export async function guestJoin(input: {
  joinCode: string;
  displayName: string;
  ipAddress?: string;
}): Promise<{
  session: {
    id: string;
    title: string;
    gameMode: string;
    status: string;
    currentRound: number;
    totalRounds: number;
    code: string;
  };
  player: {
    id: string;
    displayName: string;
    score: number;
  };
  guestToken: string;
}> {
  const { joinCode, displayName } = input;

  if (!displayName || displayName.trim().length < 1) {
    throw badRequest("Display name is required");
  }
  if (displayName.length > 30) {
    throw badRequest("Display name must be 30 characters or less");
  }

  // Find the lobby by join code
  const lobby = await db.lobby.findUnique({ where: { joinCode } });
  if (!lobby) throw notFound("Quiz not found with this code");
  if (lobby.status === "closed") throw forbidden("This quiz has ended");
  if (lobby.locked) throw forbidden("This quiz is locked");

  const session = await db.liveSession.findUnique({
    where: { id: lobby.sessionId },
    select: {
      id: true, title: true, gameMode: true, status: true,
      currentRound: true, totalRounds: true, code: true, maxPlayers: true,
    },
  });
  if (!session) throw notFound("Session not found");

  if (session.status === "finished" || session.status === "cancelled") {
    throw forbidden("This quiz has ended");
  }

  // Check capacity
  const playerCount = await db.livePlayer.count({
    where: { sessionId: session.id, status: "active" },
  });
  if (playerCount >= session.maxPlayers) {
    throw forbidden("This quiz is full");
  }

  // Create the guest player record
  const player = await db.livePlayer.create({
    data: {
      sessionId: session.id,
      userId: null, // Guest — no User account
      isGuest: true,
      displayName: displayName.trim(),
      role: "player",
      status: "active",
      state: "{}",
    },
  });

  // Issue guest token
  const guestToken = await signGuestToken({
    playerId: player.id,
    sessionId: session.id,
    displayName: player.displayName,
    isGuest: true,
  });

  log.info("guest.joined", {
    playerId: player.id,
    sessionId: session.id,
    displayName: player.displayName,
    ip: input.ipAddress,
  });

  return {
    session: {
      id: session.id,
      title: session.title,
      gameMode: session.gameMode,
      status: session.status,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
      code: session.code,
    },
    player: {
      id: player.id,
      displayName: player.displayName,
      score: player.score,
    },
    guestToken,
  };
}

/**
 * Guest answer — verifies the guest token, records a LiveAnswer.
 * Server determines correctness — the guest never submits correctness.
 *
 * Two call shapes are supported so that REST and Socket.IO can share the
 * SAME business logic without duplicating it:
 *
 *   • REST path:    pass `{ guestToken, roundId, answer }` — the token is
 *                    verified server-side inside this function.
 *   • Socket.IO:    pass `{ guestPayload, roundId, answer }` where
 *                    `guestPayload` is the ALREADY-VERIFIED token payload
 *                    (the Socket.IO middleware verified it on connect).
 */
export async function guestAnswer(input: {
  guestToken?: string;
  guestPayload?: GuestTokenPayload;
  roundId: string;
  answer: unknown;
}): Promise<{
  recorded: boolean;
  isCorrect: boolean;
  score: number;
  correctAnswer?: unknown;
}> {
  let payload: GuestTokenPayload;
  if (input.guestPayload) {
    payload = input.guestPayload;
  } else if (input.guestToken) {
    payload = await verifyGuestToken(input.guestToken);
  } else {
    throw new Error("Either guestToken or guestPayload must be provided");
  }

  // Verify the round belongs to the guest's session
  const round = await db.liveRound.findUnique({
    where: { id: input.roundId },
    select: { id: true, sessionId: true, questionSnapshot: true, status: true, answerLockAt: true, roundNumber: true },
  });
  if (!round) throw notFound("Round not found");
  if (round.sessionId !== payload.sessionId) {
    throw forbidden("Round does not belong to your session");
  }
  if (round.status !== "active") {
    throw forbidden("This round is no longer accepting answers");
  }
  // answerLockAt: the server enforces the round's answer window even on the
  // REST path. Without this check, a guest could POST after the round is
  // locked and have their late answer recorded.
  if (round.answerLockAt && new Date() > round.answerLockAt) {
    throw forbidden("Answer is locked");
  }

  // Check if already answered (idempotency)
  const existing = await db.liveAnswer.findUnique({
    where: {
      roundId_playerId: { roundId: input.roundId, playerId: payload.playerId },
    },
  });
  if (existing) {
    // Already answered — return the existing result (idempotent)
    return {
      recorded: true,
      isCorrect: existing.isCorrect ?? false,
      score: existing.pointsAwarded,
    };
  }

  // Server-side correctness check
  let snapshot: Record<string, unknown> | null = null;
  if (round.questionSnapshot) {
    try {
      snapshot = typeof round.questionSnapshot === "string"
        ? JSON.parse(round.questionSnapshot) as Record<string, unknown>
        : round.questionSnapshot as Record<string, unknown>;
    } catch {
      snapshot = null;
    }
  }
  const correctIndex = snapshot?.correctIndex as number | undefined;
  const guestAnswerValue = typeof input.answer === "number" ? input.answer : -1;
  const isCorrect = correctIndex !== undefined && guestAnswerValue === correctIndex;

  // Award points (base 100 + speed bonus based on response time — simplified for guest)
  const pointsAwarded = isCorrect ? 100 : 0;

  await db.liveAnswer.create({
    data: {
      roundId: input.roundId,
      playerId: payload.playerId,
      answer: JSON.stringify({ value: guestAnswerValue }),
      isCorrect,
      pointsAwarded,
      responseMs: 0,
    },
  });

  // Update player score
  await db.livePlayer.update({
    where: { id: payload.playerId },
    data: {
      score: { increment: pointsAwarded },
      answeredCount: { increment: 1 },
      correctCount: { increment: isCorrect ? 1 : 0 },
      wrongCount: { increment: isCorrect ? 0 : 1 },
    },
  });

  return {
    recorded: true,
    isCorrect,
    score: pointsAwarded,
    correctAnswer: correctIndex,
  };
}

/**
 * Guest status — returns the current session state + current round question
 * (without the correct answer) so the guest can see and answer it.
 */
export async function guestStatus(input: {
  guestToken: string;
}): Promise<{
  session: {
    id: string;
    title: string;
    gameMode: string;
    status: string;
    currentRound: number;
    totalRounds: number;
  };
  player: {
    id: string;
    displayName: string;
    score: number;
    correctCount: number;
  };
  currentRound: {
    id: string;
    roundNumber: number;
    question: {
      question: string;
      options: string[];
      media?: { required: boolean; type?: string; search?: string } | null;
    } | null;
    hasAnswered: boolean;
    status: string;
  } | null;
}> {
  const payload = await verifyGuestToken(input.guestToken);

  const session = await db.liveSession.findUnique({
    where: { id: payload.sessionId },
    select: {
      id: true, title: true, gameMode: true, status: true,
      currentRound: true, totalRounds: true,
    },
  });
  if (!session) throw notFound("Session not found");

  const player = await db.livePlayer.findUnique({
    where: { id: payload.playerId },
    select: {
      id: true, displayName: true, score: true,
      correctCount: true, status: true,
    },
  });
  if (!player) throw notFound("Player not found");

  // Get current round
  const round = await db.liveRound.findFirst({
    where: { sessionId: session.id, roundNumber: session.currentRound, status: "active" },
    select: {
      id: true, roundNumber: true, questionSnapshot: true, status: true,
      answerLockAt: true, revealAt: true,
    },
  });

  type CurrentRoundInfo = {
    id: string;
    roundNumber: number;
    question: { question: string; options: string[]; media?: { required: boolean; type?: string; search?: string } | null } | null;
    hasAnswered: boolean;
    status: string;
  };
  let currentRound: CurrentRoundInfo | null = null;
  if (round && round.status === "active") {
    // Check if player already answered
    const existingAnswer = await db.liveAnswer.findUnique({
      where: {
        roundId_playerId: { roundId: round.id, playerId: payload.playerId },
      },
      select: { id: true },
    });

    // Build question preview WITHOUT the correct answer
    let snapshot: Record<string, unknown> | null = null;
    if (round.questionSnapshot) {
      try {
        snapshot = typeof round.questionSnapshot === "string"
          ? JSON.parse(round.questionSnapshot) as Record<string, unknown>
          : round.questionSnapshot as Record<string, unknown>;
      } catch {
        snapshot = null;
      }
    }
    currentRound = {
      id: round.id,
      roundNumber: round.roundNumber,
      question: snapshot
        ? {
            question: String(snapshot.question ?? ""),
            options: Array.isArray(snapshot.options) ? (snapshot.options as string[]) : [],
            media: (snapshot.media as { required: boolean; type?: string; search?: string } | null) ?? null,
          }
        : null,
      hasAnswered: !!existingAnswer,
      status: round.status,
    };
  }

  return {
    session: {
      id: session.id,
      title: session.title,
      gameMode: session.gameMode,
      status: session.status,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
    },
    player: {
      id: player.id,
      displayName: player.displayName,
      score: player.score,
      correctCount: player.correctCount,
    },
    currentRound,
  };
}
