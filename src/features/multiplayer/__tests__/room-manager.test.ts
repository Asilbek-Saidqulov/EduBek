import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomManager } from "../room-manager";

vi.mock("@/lib/db", () => ({
  db: {
    quiz: { findUnique: vi.fn() },
    assessment: { findUnique: vi.fn() },
    liveSession: { create: vi.fn() },
    lobby: { create: vi.fn() },
  },
}));

import { db } from "@/lib/db";

describe("Multiplayer RoomManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRoom", () => {
    it("creates room with default questions when no quiz/assessment provided", async () => {
      const mockSession = {
        id: "session-1",
        code: "XYZ999",
        hostId: "host-1",
        title: "Test Room",
        status: "lobby",
        totalRounds: 3,
      };
      (db.liveSession.create as any).mockResolvedValue(mockSession);
      (db.lobby.create as any).mockResolvedValue({ id: "lobby-1" });

      const manager = RoomManager.getInstance();
      const room = await manager.createRoom({
        hostId: "host-1",
        title: "Test Room",
        gameMode: "classic",
        maxPlayers: 10,
      });

      expect(room.roomId).toBe("session-1");
      expect(room.totalRounds).toBe(3);
      expect(room.code.length).toBe(6);
      expect(room.getAuthoritativeQuestion(0)).toBeDefined();
      expect(room.getAuthoritativeQuestion(1)).toBeDefined();
      expect(room.getAuthoritativeQuestion(2)).toBeDefined();
      expect(db.liveSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hostId: "host-1",
          title: "Test Room",
          gameMode: "classic",
          maxPlayers: 10,
          status: "lobby",
        }),
      });
    });

    it("loads questions from quiz", async () => {
      const mockQuiz = {
        id: "quiz-1",
        title: "Quiz Title",
        questions: [
          { id: "q1", question: "Q1", type: "multiple_choice", options: JSON.stringify(["A", "B"]), correctIndex: 0, explanation: "", points: 1, difficulty: "easy", orderNum: 0 },
          { id: "q2", question: "Q2", type: "true_false", options: JSON.stringify(["True", "False"]), correctIndex: 1, explanation: "", points: 1, difficulty: "medium", orderNum: 1 },
        ],
      };
      (db.quiz.findUnique as any).mockResolvedValue(mockQuiz);
      (db.liveSession.create as any).mockResolvedValue({ id: "s1", code: "ABC123", hostId: "h1", title: "Room", status: "lobby", totalRounds: 2 });
      (db.lobby.create as any).mockResolvedValue({ id: "l1" });

      const manager = RoomManager.getInstance();
      const room = await manager.createRoom({
        hostId: "h1",
        title: "Room",
        quizId: "quiz-1",
      });

      expect(room.totalRounds).toBe(2);
      expect(room.getAuthoritativeQuestion(0)?.prompt).toBe("Q1");
      expect(room.getAuthoritativeQuestion(1)?.type).toBe("true_false");
    });

    it("generates unique room codes", async () => {
      (db.liveSession.create as any).mockResolvedValue({ id: "s1", code: "ABC123", hostId: "h1", title: "Room", status: "lobby", totalRounds: 3 });
      (db.lobby.create as any).mockResolvedValue({ id: "l1" });

      const manager = RoomManager.getInstance();
      const room1 = await manager.createRoom({ hostId: "h1", title: "Room 1" });
      const room2 = await manager.createRoom({ hostId: "h1", title: "Room 2" });

      expect(room1.code).not.toBe(room2.code);
    });

    it("persists LiveSession and Lobby to database", async () => {
      (db.liveSession.create as any).mockResolvedValue({ id: "s1", code: "ABC123", hostId: "h1", title: "Room", status: "lobby", totalRounds: 3 });
      (db.lobby.create as any).mockResolvedValue({ id: "l1" });

      const manager = RoomManager.getInstance();
      await manager.createRoom({ hostId: "h1", title: "Room" });

      expect(db.liveSession.create).toHaveBeenCalledTimes(1);
      expect(db.lobby.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("room lookup", () => {
    it("finds room by id", async () => {
      (db.liveSession.create as any).mockResolvedValue({ id: "s1", code: "ABC123", hostId: "h1", title: "Room", status: "lobby", totalRounds: 3 });
      (db.lobby.create as any).mockResolvedValue({ id: "l1" });

      const manager = RoomManager.getInstance();
      const room = await manager.createRoom({ hostId: "h1", title: "Room" });
      const found = manager.getRoomById(room.roomId);
      expect(found).toBe(room);
    });

    it("finds room by code (case-insensitive)", async () => {
      (db.liveSession.create as any).mockResolvedValue({ id: "s1", code: "AZTGG6", hostId: "h1", title: "Room", status: "lobby", totalRounds: 3 });
      (db.lobby.create as any).mockResolvedValue({ id: "l1" });

      const manager = RoomManager.getInstance();
      const room = await manager.createRoom({ hostId: "h1", title: "Room" });
      const generatedCode = room.code;
      const found = manager.getRoomByCode(generatedCode.toLowerCase());
      expect(found).toBe(room);
    });
  });

  describe("cleanup", () => {
    it("removes finished rooms during cleanup", async () => {
      (db.liveSession.create as any).mockResolvedValue({ id: "s1", code: "ABC123", hostId: "h1", title: "Room", status: "lobby", totalRounds: 3 });
      (db.lobby.create as any).mockResolvedValue({ id: "l1" });

      const manager = RoomManager.getInstance();
      const room = await manager.createRoom({ hostId: "h1", title: "Room" });
      room.status = "finished";
      (manager as any).cleanupStaleRooms();
      expect(manager.getRoomById(room.roomId)).toBeUndefined();
    });
  });
});
