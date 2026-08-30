import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameRoom } from "../engine";
import type { AuthoritativeQuestion, RoomStatus } from "../types";

vi.useFakeTimers({ shouldAdvanceTime: true });

function makeQuestion(overrides: Partial<AuthoritativeQuestion> = {}): AuthoritativeQuestion {
  return {
    id: overrides.id || "q1",
    prompt: overrides.prompt || "Test question",
    type: overrides.type || "multiple_choice",
    options: overrides.options || ["A", "B", "C", "D"],
    correctIndex: overrides.correctIndex ?? 1,
    correctAnswer: overrides.correctAnswer || "B",
    explanation: overrides.explanation || "Explanation",
    points: overrides.points || 1,
    durationMs: overrides.durationMs || 30000,
    difficulty: overrides.difficulty || "medium",
  };
}

describe("Multiplayer GameRoom Engine", () => {
  let room: GameRoom;
  const onStateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    room = new GameRoom({
      roomId: "room-1",
      code: "ABC123",
      hostId: "host-1",
      title: "Test Room",
      gameMode: "classic",
      maxPlayers: 4,
      questions: [makeQuestion({ id: "q1" }), makeQuestion({ id: "q2" })],
      onStateChange,
    });
  });

  describe("initial state", () => {
    it("starts in lobby status", () => {
      expect(room.status).toBe("lobby");
    });

    it("has correct totalRounds", () => {
      expect(room.totalRounds).toBe(2);
    });

    it("has empty players", () => {
      expect(room.getAllPlayers()).toHaveLength(0);
    });
  });

  describe("player management", () => {
    it("adds a new player", () => {
      const { player, isNew } = room.addOrUpdatePlayer({
        userId: "u1",
        socketId: "s1",
        displayName: "Alice",
        role: "player",
      });
      expect(isNew).toBe(true);
      expect(player.displayName).toBe("Alice");
      expect(player.role).toBe("player");
      expect(room.getAllPlayers()).toHaveLength(1);
    });

    it("assigns host role automatically", () => {
      const { player } = room.addOrUpdatePlayer({
        userId: "host-1",
        socketId: "s1",
        displayName: "Host",
      });
      expect(player.role).toBe("host");
    });

    it("prevents duplicate userId membership", () => {
      room.addOrUpdatePlayer({ userId: "u1", socketId: "s1", displayName: "Alice" });
      const { player } = room.addOrUpdatePlayer({ userId: "u1", socketId: "s2", displayName: "Alice 2" });
      expect(room.getAllPlayers()).toHaveLength(1);
      expect(player.socketId).toBe("s2");
    });

    it("prevents joining finished room", () => {
      room.status = "finished";
      expect(() => room.addOrUpdatePlayer({ userId: "u2", displayName: "Bob" })).toThrow("closed match");
    });

    it("marks player disconnected on socket disconnect", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", socketId: "s1", displayName: "Alice" });
      room.handleSocketDisconnect("s1");
      expect(player.status).toBe("disconnected");
      expect(player.socketId).toBeNull();
    });

    it("removes player", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", socketId: "s1", displayName: "Alice" });
      room.removePlayer(player.id);
      expect(room.getAllPlayers()).toHaveLength(0);
    });
  });

  describe("ready state", () => {
    it("sets player ready", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      const updated = room.setPlayerReady(player.id, true);
      expect(updated.isReady).toBe(true);
      expect(updated.status).toBe("ready");
    });

    it("unsets player ready", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      room.setPlayerReady(player.id, true);
      const updated = room.setPlayerReady(player.id, false);
      expect(updated.isReady).toBe(false);
      expect(updated.status).toBe("active");
    });
  });

  describe("match lifecycle", () => {
    it("starts countdown from lobby", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(player.id);
      expect(room.status).toBe("countdown");
    });

    it("rejects countdown from non-host", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      expect(() => room.startCountdown(player.id)).toThrow("Only the host");
    });

    it("rejects countdown from wrong status", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.status = "in_progress";
      expect(() => room.startCountdown(player.id)).toThrow("Cannot start countdown");
    });

    it("starts first round after countdown", async () => {
      const { player } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(player.id);
      await vi.advanceTimersByTimeAsync(3000);
      expect(room.status).toBe("in_progress");
      expect(room.currentRoundIndex).toBe(0);
    });

    it("finishes match after last round", async () => {
      const { player: host } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(host.id);
      await vi.advanceTimersByTimeAsync(3000);

      const { player: p1 } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      room.submitAnswer(p1.id, { roundNumber: 1, answer: 1 });
      await vi.advanceTimersByTimeAsync(30200);
      expect(room.status).toBe("question_results");
      room.nextQuestion(host.id);
      expect(room.status).toBe("in_progress");

      const { player: p2 } = room.addOrUpdatePlayer({ userId: "u2", displayName: "Bob" });
      room.submitAnswer(p2.id, { roundNumber: 2, answer: 1 });
      await vi.advanceTimersByTimeAsync(30200);
      expect(room.status).toBe("question_results");
      room.nextQuestion(host.id);
      expect(room.status).toBe("finished");
    });

    it("cancels match", () => {
      room.cancelMatch("Test cancel");
      expect(room.status).toBe("cancelled");
    });
  });

  describe("answer submission", () => {
    beforeEach(async () => {
      const { player } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(player.id);
      await vi.advanceTimersByTimeAsync(3000);
    });

    it("accepts correct answer", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      const { record, isFirstSubmission } = room.submitAnswer(player.id, {
        roundNumber: 1,
        answer: 1,
      });
      expect(isFirstSubmission).toBe(true);
      expect(record.isCorrect).toBe(true);
      expect(record.pointsAwarded).toBeGreaterThan(0);
      expect(player.score).toBeGreaterThan(0);
    });

    it("rejects duplicate answer idempotently", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      const first = room.submitAnswer(player.id, { roundNumber: 1, answer: 1 });
      const second = room.submitAnswer(player.id, { roundNumber: 1, answer: 0 });
      expect(first.isFirstSubmission).toBe(true);
      expect(second.isFirstSubmission).toBe(false);
      expect(second.record.pointsAwarded).toBe(first.record.pointsAwarded);
    });

    it("rejects answer after round finished", async () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      await vi.advanceTimersByTimeAsync(30200);
      expect(() => room.submitAnswer(player.id, { roundNumber: 1, answer: 1 })).toThrow("No active question");
    });

    it("rejects answer when no active question", () => {
      const { player } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      room.status = "lobby";
      expect(() => room.submitAnswer(player.id, { roundNumber: 1, answer: 1 })).toThrow("No active question");
    });
  });

  describe("leaderboard", () => {
    it("returns leaderboard sorted by score", async () => {
      const { player: host } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(host.id);
      await vi.advanceTimersByTimeAsync(3000);

      const { player: p1 } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      const { player: p2 } = room.addOrUpdatePlayer({ userId: "u2", displayName: "Bob" });

      room.submitAnswer(p1.id, { roundNumber: 1, answer: 1 });
      room.submitAnswer(p2.id, { roundNumber: 1, answer: 0 });
      await vi.advanceTimersByTimeAsync(30200);

      const snapshot = room.getStateSnapshot(host.id);
      const leaderboard = snapshot.leaderboard;
      expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);
    });
  });

  describe("state snapshot", () => {
    it("returns sanitized snapshot without correct answer during active question", async () => {
      const { player: host } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(host.id);
      await vi.advanceTimersByTimeAsync(3000);

      const snapshot = room.getStateSnapshot(host.id);
      expect(snapshot.status).toBe("in_progress");
      expect(snapshot.activeQuestion).not.toBeNull();
      if (snapshot.activeQuestion) {
        expect(snapshot.activeQuestion).not.toHaveProperty("correctIndex");
        expect(snapshot.activeQuestion).not.toHaveProperty("correctAnswer");
      }
    });

    it("reveals correct answer after results", async () => {
      const { player: host } = room.addOrUpdatePlayer({ userId: "host-1", displayName: "Host", role: "host" });
      room.startCountdown(host.id);
      await vi.advanceTimersByTimeAsync(3000);

      const { player: p1 } = room.addOrUpdatePlayer({ userId: "u1", displayName: "Alice" });
      room.submitAnswer(p1.id, { roundNumber: 1, answer: 1 });
      await vi.advanceTimersByTimeAsync(30200);

      const snapshot = room.getStateSnapshot(host.id);
      expect(snapshot.status).toBe("question_results");
      expect(snapshot.lastQuestionResult).not.toBeNull();
      expect(snapshot.lastQuestionResult?.correctAnswer).toBe("B");
    });
  });
});
