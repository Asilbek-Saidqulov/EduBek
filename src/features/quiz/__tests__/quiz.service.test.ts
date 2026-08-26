import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizService } from "../quiz.service";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";

vi.mock("@/lib/db", () => {
  return {
    db: {
      $transaction: vi.fn(),
      quiz: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      question: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      quizAttempt: {
        create: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      profile: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

describe("QuizService Logic & Lifecycle Tests", () => {
  let quizService: QuizService;

  beforeEach(() => {
    vi.clearAllMocks();
    quizService = new QuizService();
  });

  describe("1. Quiz Creation", () => {
    it("should reject a question with an invalid correctIndex out of bounds", async () => {
      await expect(
        quizService.createQuiz("user-1", {
          title: "Test Title",
          questions: [
            {
              question: "Sample Q?",
              options: ["A", "B"],
              correctIndex: 3, // Out of bounds
            },
          ],
        })
      ).rejects.toThrow(ApiError);
    });

    it("should create quiz and increment creator's gamesCreated", async () => {
      const mockCreatedQuiz = {
        id: "quiz-123",
        title: "Uzbek Culture",
        teacherId: "user-1",
        questions: [
          {
            id: "q-1",
            question: "Question 1?",
            options: JSON.stringify(["A", "B"]),
            correctIndex: 0,
            points: 1,
          },
        ],
      };

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quiz: { create: vi.fn().mockResolvedValue(mockCreatedQuiz) },
          profile: { upsert: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await quizService.createQuiz("user-1", {
        title: "Uzbek Culture",
        questions: [
          {
            question: "Question 1?",
            options: ["A", "B"],
            correctIndex: 0,
            points: 1,
          },
        ],
      });

      expect(result.id).toBe("quiz-123");
      expect(result.questions[0].options).toEqual(["A", "B"]);
    });
  });

  describe("2. Quiz Retrieval & Anti-Cheat Question Masking", () => {
    const mockQuizWithQuestions = {
      id: "quiz-123",
      title: "Science Quiz",
      teacherId: "teacher-1",
      isPublished: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      teacher: { id: "teacher-1", name: "Teacher A" },
      _count: { questions: 2, attempts: 5 },
      questions: [
        {
          id: "q-1",
          type: "multiple_choice",
          question: "What is H2O?",
          options: JSON.stringify(["Water", "Gold"]),
          correctIndex: 0,
          explanation: "H2O is water.",
          points: 2,
          difficulty: "easy",
          orderNum: 0,
        },
      ],
    };

    it("should return full questions with correctIndex to the quiz creator", async () => {
      (db.quiz.findUnique as any).mockResolvedValue(mockQuizWithQuestions);

      const result = await quizService.getQuizById("quiz-123", "teacher-1");
      expect(result.isOwner).toBe(true);
      expect((result.questions[0] as any).correctIndex).toBe(0);
      expect((result.questions[0] as any).explanation).toBe("H2O is water.");
    });

    it("should MASK correctIndex and explanation for students", async () => {
      (db.quiz.findUnique as any).mockResolvedValue(mockQuizWithQuestions);

      const result = await quizService.getQuizById("quiz-123", "student-99");
      expect(result.isOwner).toBe(false);
      expect((result.questions[0] as any).correctIndex).toBeUndefined();
      expect((result.questions[0] as any).explanation).toBeUndefined();
    });

    it("should block students from viewing unpublished draft quizzes", async () => {
      (db.quiz.findUnique as any).mockResolvedValue({
        ...mockQuizWithQuestions,
        isPublished: false,
      });

      await expect(quizService.getQuizById("quiz-123", "student-99")).rejects.toThrow(ApiError);
    });
  });

  describe("3. Publishing & Validation", () => {
    it("should reject publishing a quiz with zero questions", async () => {
      (db.quiz.findUnique as any).mockResolvedValue({
        id: "quiz-empty",
        teacherId: "teacher-1",
        _count: { questions: 0 },
      });

      await expect(quizService.publishQuiz("quiz-empty", "teacher-1")).rejects.toThrow(ApiError);
    });

    it("should reject non-owner attempting to publish", async () => {
      (db.quiz.findUnique as any).mockResolvedValue({
        id: "quiz-1",
        teacherId: "teacher-1",
        _count: { questions: 1 },
      });

      await expect(quizService.publishQuiz("quiz-1", "intruder-user")).rejects.toThrow(ApiError);
    });
  });

  describe("4. Start Attempt & Submit Attempt (Server-Authoritative Grading & XP)", () => {
    const mockActiveQuiz = {
      id: "quiz-active",
      title: "Active Quiz",
      category: "math",
      difficulty: "medium",
      mode: "classic",
      teacherId: "teacher-1",
      isPublished: true,
      questions: [
        {
          id: "q-1",
          type: "multiple_choice",
          question: "2 + 2?",
          options: JSON.stringify(["3", "4", "5"]),
          correctIndex: 1, // Option 4
          points: 2,
          difficulty: "easy",
          orderNum: 0,
        },
        {
          id: "q-2",
          type: "multiple_choice",
          question: "5 * 5?",
          options: JSON.stringify(["20", "25", "30"]),
          correctIndex: 1, // Option 25
          points: 3,
          difficulty: "medium",
          orderNum: 1,
        },
      ],
    };

    it("should start a sanitized attempt and calculate maxScore", async () => {
      (db.quiz.findUnique as any).mockResolvedValue(mockActiveQuiz);
      (db.quizAttempt.count as any).mockResolvedValue(0);
      (db.quizAttempt.create as any).mockResolvedValue({
        id: "attempt-1",
        attemptNumber: 1,
        startedAt: new Date(),
        maxScore: 5,
      });

      const attempt = await quizService.startAttempt("quiz-active", "student-1");
      expect(attempt.attemptId).toBe("attempt-1");
      expect(attempt.maxScore).toBe(5); // 2 + 3
      expect(attempt.questions).toHaveLength(2);
      expect((attempt.questions[0] as any).correctIndex).toBeUndefined();
    });

    it("should reject submission if attempt is not owned by user (IDOR protection)", async () => {
      (db.quizAttempt.findUnique as any).mockResolvedValue({
        id: "attempt-1",
        userId: "student-1",
        finishedAt: null,
        quiz: mockActiveQuiz,
      });

      await expect(
        quizService.submitAttempt("attempt-1", "intruder-user", {
          answers: [{ questionId: "q-1", selectedIndex: 1 }],
        })
      ).rejects.toThrow(ApiError);
    });

    it("should reject duplicate submission if attempt already finalized", async () => {
      (db.quizAttempt.findUnique as any).mockResolvedValue({
        id: "attempt-1",
        userId: "student-1",
        finishedAt: new Date(), // Already finished!
        quiz: mockActiveQuiz,
      });

      await expect(
        quizService.submitAttempt("attempt-1", "student-1", {
          answers: [{ questionId: "q-1", selectedIndex: 1 }],
        })
      ).rejects.toThrow(ApiError);
    });

    it("should grade answers on the server and update profile XP atomically", async () => {
      (db.quizAttempt.findUnique as any).mockResolvedValue({
        id: "attempt-1",
        quizId: "quiz-active",
        userId: "student-1",
        startedAt: new Date(),
        finishedAt: null,
        quiz: mockActiveQuiz,
      });

      (db.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          quizAttempt: {
            update: vi.fn().mockResolvedValue({
              id: "attempt-1",
              finishedAt: new Date(),
              timeSpentMs: 12000,
            }),
          },
          profile: {
            findUnique: vi.fn().mockResolvedValue({ xp: 100, level: 2, gamesPlayed: 3 }),
            upsert: vi.fn().mockResolvedValue({ xp: 325, level: 2 }),
          },
        };
        return callback(tx);
      });

      // Submit 1 correct and 1 incorrect answer
      const result = await quizService.submitAttempt("attempt-1", "student-1", {
        answers: [
          { questionId: "q-1", selectedIndex: 1 }, // Correct (+2 pts)
          { questionId: "q-2", selectedIndex: 0 }, // Incorrect (0 pts)
        ],
        timeSpentMs: 12000,
      });

      expect(result.score).toBe(2);
      expect(result.maxScore).toBe(5);
      expect(result.correctCount).toBe(1);
      expect(result.totalQuestions).toBe(2);
      expect(result.accuracy).toBe(40); // (2/5) * 100
      expect(result.earnedXp).toBe(50 + 2 * 25); // 50 base + 50 = 100 XP
      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[1].isCorrect).toBe(false);
    });
  });
});
