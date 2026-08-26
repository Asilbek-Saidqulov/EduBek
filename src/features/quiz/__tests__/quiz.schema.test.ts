import { describe, it, expect } from "vitest";
import {
  createQuizSchema,
  updateQuizSchema,
  questionInputSchema,
  submitAttemptSchema,
  listQuizzesQuerySchema,
} from "../quiz.schema";

describe("Quiz Schema & Validation", () => {
  describe("createQuizSchema", () => {
    it("validates a complete quiz creation payload", () => {
      const payload = {
        title: "Uzbekistan Geography & Culture",
        description: "Explore the provinces and historical landmarks",
        category: "geography",
        difficulty: "medium",
        mode: "classic",
        language: "uz",
        questions: [
          {
            type: "multiple_choice",
            question: "Which sea has drastically shrunk in Central Asia?",
            options: ["Aral Sea", "Caspian Sea", "Black Sea", "Red Sea"],
            correctIndex: 0,
            explanation: "The Aral Sea crisis began in the 1960s.",
            points: 2,
          },
        ],
      };

      const parsed = createQuizSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.title).toBe("Uzbekistan Geography & Culture");
        expect(parsed.data.questions).toHaveLength(1);
        expect(parsed.data.questions[0].points).toBe(2);
      }
    });

    it("rejects quiz with short title (< 3 chars)", () => {
      const payload = {
        title: "AB",
        category: "science",
      };

      const parsed = createQuizSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("questionInputSchema", () => {
    it("validates a valid question", () => {
      const payload = {
        question: "What is the speed of light in vacuum?",
        options: ["3x10^8 m/s", "1.5x10^8 m/s", "300 km/h", "Sound speed"],
        correctIndex: 0,
        explanation: "c ≈ 299,792,458 m/s.",
        points: 3,
        difficulty: "hard",
      };

      const parsed = questionInputSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.points).toBe(3);
        expect(parsed.data.difficulty).toBe("hard");
      }
    });

    it("rejects question with fewer than 2 options", () => {
      const payload = {
        question: "Is this valid?",
        options: ["Only one option"],
        correctIndex: 0,
      };

      const parsed = questionInputSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });

    it("rejects negative points", () => {
      const payload = {
        question: "Is this valid?",
        options: ["A", "B"],
        correctIndex: 0,
        points: -5,
      };

      const parsed = questionInputSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("submitAttemptSchema", () => {
    it("validates valid attempt submissions", () => {
      const payload = {
        answers: [
          { questionId: "q-1", selectedIndex: 2, timeTakenMs: 4500 },
          { questionId: "q-2", selectedIndex: 0, timeTakenMs: 3200 },
        ],
        timeSpentMs: 7700,
      };

      const parsed = submitAttemptSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.answers).toHaveLength(2);
        expect(parsed.data.timeSpentMs).toBe(7700);
      }
    });

    it("rejects empty answers array", () => {
      const payload = {
        answers: [],
      };

      const parsed = submitAttemptSchema.safeParse(payload);
      expect(parsed.success).toBe(false);
    });
  });

  describe("listQuizzesQuerySchema", () => {
    it("parses and coerces query parameters correctly", () => {
      const query = {
        category: "math",
        difficulty: "easy",
        limit: "15",
        offset: "30",
      };

      const parsed = listQuizzesQuerySchema.safeParse(query);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.limit).toBe(15);
        expect(parsed.data.offset).toBe(30);
      }
    });
  });
});
