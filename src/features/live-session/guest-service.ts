import { db } from "@/lib/db";
import { badRequest, notFound, unauthorized, forbidden } from "@/lib/errors";
import { RoomManager } from "../multiplayer/room-manager";

const roomManager = RoomManager.getInstance();

const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

export function enforceGuestJoinRateLimit(ipAddress?: string): void {
  if (!ipAddress) return;
  const now = Date.now();
  const bucket = ipRateLimits.get(ipAddress);

  if (!bucket || now > bucket.resetAt) {
    ipRateLimits.set(ipAddress, { count: 1, resetAt: now + 5 * 60 * 1000 }); // 5 minutes
    return;
  }

  if (bucket.count >= 20) {
    throw badRequest("Too many guest join attempts from this IP. Please wait 5 minutes.");
  }

  bucket.count++;
}

interface GuestTokenPayload {
  sessionId: string;
  playerId: string;
  displayName: string;
  isGuest: boolean;
  exp: number;
}

export function signGuestToken(payload: Omit<GuestTokenPayload, "exp">): string {
  const tokenData: GuestTokenPayload = {
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return Buffer.from(JSON.stringify(tokenData)).toString("base64url");
}

export function verifyGuestToken(token: string): GuestTokenPayload {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parsed: GuestTokenPayload = JSON.parse(decoded);
    if (!parsed || !parsed.sessionId || !parsed.playerId || parsed.exp < Date.now()) {
      throw unauthorized("Guest session token expired or invalid");
    }
    return parsed;
  } catch {
    throw unauthorized("Invalid guest session token");
  }
}

export async function guestJoin(params: {
  joinCode: string;
  displayName: string;
  ipAddress?: string;
}) {
  const code = params.joinCode.trim().toUpperCase();
  const room = roomManager.getRoomByCode(code);

  if (!room) {
    throw notFound("No active multiplayer room found for this code");
  }

  const { player } = room.addOrUpdatePlayer({
    displayName: params.displayName.trim(),
    isGuest: true,
    role: "player",
  });

  const guestToken = signGuestToken({
    sessionId: room.roomId,
    playerId: player.id,
    displayName: player.displayName,
    isGuest: true,
  });

  const snapshot = room.getStateSnapshot(player.id);

  return {
    success: true,
    player: {
      id: player.id,
      displayName: player.displayName,
      role: player.role,
      status: player.status,
      score: player.score,
      isReady: player.isReady,
    },
    session: snapshot,
    guestToken,
  };
}

export async function guestAnswer(params: {
  guestToken: string;
  roundId: string;
  answer: number;
}) {
  const { sessionId, playerId } = verifyGuestToken(params.guestToken);

  const room = roomManager.getRoomById(sessionId);
  if (!room) {
    throw notFound("Session is no longer active");
  }

  const player = room.getPlayerById(playerId);
  if (!player) {
    throw notFound("Player not recognized in this session");
  }

  const { record } = room.submitAnswer(playerId, {
    roundNumber: room.currentRoundIndex + 1,
    answer: params.answer,
  });

  return {
    recorded: true,
    isCorrect: record.isCorrect,
    pointsAwarded: record.pointsAwarded,
    speedBonus: record.speedBonus,
    score: player.score,
    currentRank: 1,
  };
}

export async function guestStatus(guestToken: string) {
  const { sessionId, playerId } = verifyGuestToken(guestToken);
  const room = roomManager.getRoomById(sessionId);

  if (!room) {
    throw notFound("Session not found or finished");
  }

  const player = room.getPlayerById(playerId);
  if (!player) {
    throw notFound("Player not in session");
  }

  return {
    success: true,
    snapshot: room.getStateSnapshot(playerId),
  };
}
