/**
 * EduBek — Presence system for Socket.IO.
 *
 * Tracks which participants are currently connected to each Quiz
 * Session via Socket.IO. The presence system is the foundation for:
 *
 *   • Real-time participant counts in the Lobby
 *   • "X is typing" indicators (future chat)
 *   • Reconnect detection (is the participant still in a socket room?)
 *   • Host "who's online" dashboard
 *
 * The presence map is in-memory by default. In a multi-instance
 * deployment, replace the store with a Redis-backed implementation
 * so all instances share the same presence state.
 */
import { getLogger } from "@/lib/logger";

const log = getLogger("presence");

interface PresenceEntry {
  userId: string;
  socketId: string;
  sessionId: string;
  connectedAt: number;
  lastHeartbeat: number;
  status: "online" | "idle" | "disconnected";
}

interface PresenceStore {
  get(sessionId: string): Map<string, PresenceEntry>;
  set(sessionId: string, userId: string, entry: PresenceEntry): void;
  delete(sessionId: string, userId: string): void;
  clear(): void;
}

class InMemoryPresenceStore implements PresenceStore {
  private sessions = new Map<string, Map<string, PresenceEntry>>();

  get(sessionId: string) {
    return this.sessions.get(sessionId) ?? new Map();
  }

  set(sessionId: string, userId: string, entry: PresenceEntry) {
    if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, new Map());
    this.sessions.get(sessionId)!.set(userId, entry);
  }

  delete(sessionId: string, userId: string) {
    this.sessions.get(sessionId)?.delete(userId);
  }

  clear() {
    this.sessions.clear();
  }
}

const store = new InMemoryPresenceStore();

const HEARTBEAT_TIMEOUT_MS = 45_000; // 3x the socket.io ping interval
const IDLE_THRESHOLD_MS = 30_000;

/** Mark a participant as present in a Quiz Session. */
export function markPresent(sessionId: string, userId: string, socketId: string): void {
  const now = Date.now();
  store.set(sessionId, userId, {
    userId,
    socketId,
    sessionId,
    connectedAt: now,
    lastHeartbeat: now,
    status: "online",
  });
  log.debug("presence.marked_present", { sessionId, userId, socketId });
}

/** Record a heartbeat from a participant (called on every socket event). */
export function recordHeartbeat(sessionId: string, userId: string): void {
  const entries = store.get(sessionId);
  const entry = entries.get(userId);
  if (entry) {
    entry.lastHeartbeat = Date.now();
    entry.status = "online";
  }
}

/** Mark a participant as disconnected. */
export function markDisconnected(sessionId: string, userId: string): void {
  const entries = store.get(sessionId);
  const entry = entries.get(userId);
  if (entry) {
    entry.status = "disconnected";
  }
  log.debug("presence.marked_disconnected", { sessionId, userId });
}

/** Remove a participant from presence entirely. */
export function removePresence(sessionId: string, userId: string): void {
  store.delete(sessionId, userId);
}

/** Get all online participants in a Quiz Session. */
export function getOnlineParticipants(sessionId: string): Array<{
  userId: string;
  socketId: string;
  connectedAt: number;
  status: "online" | "idle" | "disconnected";
}> {
  const entries = store.get(sessionId);
  const now = Date.now();
  const result: Array<{ userId: string; socketId: string; connectedAt: number; status: "online" | "idle" | "disconnected" }> = [];
  for (const [userId, entry] of entries) {
    // Auto-detect idle/disconnected based on heartbeat staleness
    if (now - entry.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      entry.status = "disconnected";
    } else if (now - entry.lastHeartbeat > IDLE_THRESHOLD_MS) {
      entry.status = "idle";
    }
    result.push({
      userId: entry.userId,
      socketId: entry.socketId,
      connectedAt: entry.connectedAt,
      status: entry.status,
    });
  }
  return result.filter((e) => e.status !== "disconnected");
}

/** Get the count of online participants in a Quiz Session. */
export function getOnlineCount(sessionId: string): number {
  return getOnlineParticipants(sessionId).length;
}

/** Periodic cleanup of stale presence entries (call every 60s). */
export function cleanupStalePresence(): void {
  const now = Date.now();
  for (const [sessionId, entries] of iterateAllSessions()) {
    for (const [userId, entry] of entries) {
      if (now - entry.lastHeartbeat > HEARTBEAT_TIMEOUT_MS * 2) {
        store.delete(sessionId, userId);
        log.debug("presence.cleaned_up", { sessionId, userId });
      }
    }
  }
}

// Helper to iterate all sessions (not exposed on the store interface)
function* iterateAllSessions(): Generator<[string, Map<string, PresenceEntry>]> {
  // In the in-memory store, we access the internal map
  // In a Redis store, this would be a SCAN operation
  const sessionIds = new Set<string>();
  // We can't enumerate sessions from the store interface, so we track them separately
  // This is a limitation of the in-memory store; Redis would handle this natively
  for (const sid of knownSessionIds) {
    yield [sid, store.get(sid)];
  }
}

// Track known session IDs for iteration (in-memory only)
const knownSessionIds = new Set<string>();

// Override markPresent to also track session IDs
const _originalMarkPresent = markPresent;
export function _trackSession(sessionId: string) {
  knownSessionIds.add(sessionId);
}

// Run cleanup every 60 seconds
setInterval(() => {
  cleanupStalePresence();
}, 60_000).unref?.();
