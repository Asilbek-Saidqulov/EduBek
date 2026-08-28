import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAssessment,
  listAssessments,
  getAssessment,
  updateAssessment,
  addQuestions,
  removeQuestion,
  publishAssessment,
  archiveAssessment,
  duplicateAssessment,
  startAttempt,
  submitAttempt,
  listAttempts,
  getAttempt,
  gradeResponse,
  generateAssessment,
  generateQuestions,
  generateExplanation,
  generateRubric,
} from "../index";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/errors";

vi.mock("@/lib/db", () => {
  return {
    db: {
      assessment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      assessmentQuestion: {
        create: vi.fn(),
        upsert: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
      },
      bankQuestion: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      assessmentAttempt: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      assessmentResponse: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

const mockTeacherAuth: any = {
  user: {
    id: "teacher-1",
    email: "teacher@edubek.uz",
    name: "Teacher Alisher",
    role: "teacher",
  },
};

const mockStudentAuth: any = {
  user: {
    id: "student-1",
    email: "student@edubek.uz",
    name: "Student Nodira",
    role: "student",
  },
};

describe("Assessment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Creation & Listing", () => {
    it("creates an assessment draft for teacher", async () => {
      const mockCreated = {
        id: "assess-1",
        ownerId: "teacher-1",
        title: "Mathematics Midterm",
        status: "draft",
        assessmentType: "exam",
        questions: [],
      };

      (db.assessment.create as any).mockResolvedValue(mockCreated);

      const result = await createAssessment(mockTeacherAuth, {
        title: "Mathematics Midterm",
        assessmentType: "exam",
        duration: 3600,
        passingScore: 70,
      });

      expect(result.id).toBe("assess-1");
      expect(db.assessment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: "teacher-1",
            title: "Mathematics Midterm",
            status: "draft",
          }),
        }),
      );
    });

    it("lists assessments with pagination", async () => {
      (db.assessment.findMany as any).mockResolvedValue([
        { id: "a1", title: "Algebra", status: "published" },
      ]);
      (db.assessment.count as any).mockResolvedValue(1);

      const result = await listAssessments(mockStudentAuth, {
        page: 1,
        pageSize: 10,
      });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("2. Assessment Lifecycle: Update, Questions, Publish & Archive", () => {
    it("updates assessment details", async () => {
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "assess-1",
        ownerId: "teacher-1",
        status: "draft",
      });
      (db.assessment.update as any).mockResolvedValue({
        id: "assess-1",
        title: "Updated Title",
      });

      const updated = await updateAssessment(mockTeacherAuth, "assess-1", {
        title: "Updated Title",
      });

      expect(updated.title).toBe("Updated Title");
    });

    it("adds questions and creates BankQuestions if needed", async () => {
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "assess-1",
        ownerId: "teacher-1",
      });
      (db.assessmentQuestion.count as any).mockResolvedValue(0);
      (db.bankQuestion.create as any).mockResolvedValue({
        id: "bank-q1",
        ownerId: "teacher-1",
      });
      (db.assessmentQuestion.upsert as any).mockResolvedValue({
        id: "aq-1",
        assessmentId: "assess-1",
        questionId: "bank-q1",
      });

      const result = await addQuestions(mockTeacherAuth, "assess-1", {
        questions: [
          {
            prompt: "What is 2 + 2?",
            questionType: "multiple_choice",
            payload: { options: ["3", "4", "5"], correctAnswer: "4" },
            points: 2,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(db.bankQuestion.create).toHaveBeenCalled();
    });

    it("publishes an assessment with questions", async () => {
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "assess-1",
        ownerId: "teacher-1",
        _count: { questions: 3 },
      });
      (db.assessment.update as any).mockResolvedValue({
        id: "assess-1",
        status: "published",
      });

      const published = await publishAssessment(mockTeacherAuth, "assess-1");
      expect(published.status).toBe("published");
    });

    it("rejects publishing an empty assessment", async () => {
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "assess-1",
        ownerId: "teacher-1",
        _count: { questions: 0 },
      });

      await expect(publishAssessment(mockTeacherAuth, "assess-1")).rejects.toThrow(
        ApiError,
      );
    });

    it("duplicates assessment to a new draft", async () => {
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "assess-1",
        title: "Original Assessment",
        assessmentType: "quiz",
        questions: [{ questionId: "q-1", order: 0, points: 2 }],
      });
      (db.assessment.create as any).mockResolvedValue({
        id: "assess-2",
        title: "Original Assessment (Copy)",
        status: "draft",
      });

      const duplicated = await duplicateAssessment(mockTeacherAuth, "assess-1");
      expect(duplicated.id).toBe("assess-2");
    });
  });

  describe("3. Attempts & Auto-Grading", () => {
    it("starts a new attempt and hides answer keys", async () => {
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "assess-1",
        title: "History Quiz",
        status: "published",
        maxAttempts: 2,
        questions: [
          {
            id: "aq-1",
            questionId: "q-1",
            points: 5,
            order: 0,
            question: {
              id: "q-1",
              questionType: "multiple_choice",
              payload: JSON.stringify({
                prompt: "Capital of Uzbekistan?",
                options: ["Tashkent", "Samarkand"],
                correctAnswer: "Tashkent",
              }),
            },
          },
        ],
      });
      (db.assessmentAttempt.findMany as any).mockResolvedValue([]);
      (db.assessmentAttempt.create as any).mockResolvedValue({
        id: "attempt-1",
        assessmentId: "assess-1",
        studentId: "student-1",
        status: "in_progress",
      });

      const started = await startAttempt(mockStudentAuth, "assess-1");
      expect(started.attempt.id).toBe("attempt-1");
      expect(started.assessment.questions[0].payload.correctAnswer).toBeUndefined();
    });

    it("submits and auto-grades responses correctly", async () => {
      (db.assessmentAttempt.findUnique as any).mockResolvedValue({
        id: "attempt-1",
        studentId: "student-1",
        status: "in_progress",
        assessment: {
          id: "assess-1",
          passingScore: 70,
          questions: [
            {
              questionId: "q-1",
              points: 10,
              question: {
                questionType: "multiple_choice",
                payload: JSON.stringify({ correctAnswer: "Tashkent" }),
              },
            },
            {
              questionId: "q-2",
              points: 10,
              question: {
                questionType: "multiple_choice",
                payload: JSON.stringify({ correctAnswer: "Blue" }),
              },
            },
          ],
        },
      });

      (db.assessmentResponse.upsert as any).mockResolvedValue({});
      (db.assessmentAttempt.update as any).mockImplementation(({ data }: any) => {
        return {
          id: "attempt-1",
          ...data,
        };
      });

      const submitted = await submitAttempt(mockStudentAuth, "attempt-1", {
        responses: [
          { questionId: "q-1", answer: "Tashkent", timeSpentMs: 5000 },
          { questionId: "q-2", answer: "Red", timeSpentMs: 4000 },
        ],
      });

      // 10 out of 20 points => 50%
      expect(submitted.pointsAwarded).toBe(10);
      expect(submitted.score).toBe(50);
      expect(submitted.passed).toBe(false); // passingScore was 70
      expect(submitted.status).toBe("graded");
    });
  });

  describe("4. AI Helpers", () => {
    it("generates assessment outline with fallback", async () => {
      const result = await generateAssessment(mockTeacherAuth, {
        topic: "Solar System",
        questionCount: 3,
      });

      expect(result.success).toBe(true);
      expect(result.questions.length).toBe(3);
    });

    it("generates explanation for student", async () => {
      const result = await generateExplanation(mockStudentAuth, {
        questionPrompt: "What is photosynthesis?",
        questionType: "multiple_choice",
        correctAnswer: "Process plants use to synthesize foods from carbon dioxide and water",
        studentAnswer: "Process of cellular respiration",
      });

      expect(result.success).toBe(true);
      expect(result.explanation).toBeDefined();
    });

    it("generates rubric with structured criteria", async () => {
      const result = await generateRubric(mockTeacherAuth, {
        topic: "Essay on Silk Road History",
        maxPoints: 100,
      });

      expect(result.success).toBe(true);
      expect(result.criteria.length).toBeGreaterThan(0);
      expect(result.maxPoints).toBe(100);
    });
  });
});
