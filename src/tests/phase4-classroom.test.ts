import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createClassroom,
  listMyClassrooms,
  getClassroom,
  updateClassroom,
  archiveClassroom,
  regenerateJoinCode,
  joinClassroom,
  leaveClassroom,
  inviteStudent,
  removeStudent,
  getClassroomAnalytics,
} from "@/features/classroom";
import {
  createAssignment,
  listAssignmentsByClassroom,
  getAssignment,
  updateAssignment,
  archiveAssignment,
  startAssignmentAttempt,
  submitAssignmentAttempt,
  getAssignmentAnalytics,
} from "@/features/assignment";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      classroom: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      classroomStudent: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
      },
      assignment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      assessment: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      assessmentAttempt: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      assessmentResponse: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      bankQuestion: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      assessmentQuestion: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

describe("Phase 4: Classroom & Assessment Workflow", () => {
  const teacherUser = {
    id: "teacher-user-1",
    email: "teacher@edubek.uz",
    role: "TEACHER",
    name: "Teacher One",
    username: "teacher1",
  };

  const studentUser1 = {
    id: "student-user-1",
    email: "student1@edubek.uz",
    role: "STUDENT",
    name: "Student One",
    username: "student1",
  };

  const studentUser2 = {
    id: "student-user-2",
    email: "student2@edubek.uz",
    role: "STUDENT",
    name: "Student Two",
    username: "student2",
  };

  const outsiderUser = {
    id: "outsider-user-1",
    email: "outsider@edubek.uz",
    role: "STUDENT",
    name: "Outsider",
    username: "outsider",
  };

  const teacherCtx: any = {
    user: teacherUser,
    userId: teacherUser.id,
    email: teacherUser.email,
    isAuthenticated: true,
  };

  const student1Ctx: any = {
    user: studentUser1,
    userId: studentUser1.id,
    email: studentUser1.email,
    isAuthenticated: true,
  };

  const student2Ctx: any = {
    user: studentUser2,
    userId: studentUser2.id,
    email: studentUser2.email,
    isAuthenticated: true,
  };

  const outsiderCtx: any = {
    user: outsiderUser,
    userId: outsiderUser.id,
    email: outsiderUser.email,
    isAuthenticated: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Classroom Lifecycle & Join Codes", () => {
    it("creates a classroom with a unique join code", async () => {
      (db.classroom.findUnique as any).mockResolvedValue(null);
      (db.classroom.create as any).mockImplementation(({ data }: any) => ({
        id: "c-1",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || "active",
      }));

      const classroom = await createClassroom(teacherCtx, {
        name: "Grade 10 Physics",
        subject: "Physics",
        grade: "Grade 10",
        description: "Kinematics and Dynamics",
      });

      expect(classroom.id).toBe("c-1");
      expect(classroom.name).toBe("Grade 10 Physics");
      expect(classroom.teacherId).toBe(teacherUser.id);
      expect(classroom.joinCode).toBeDefined();
      expect(classroom.joinCode?.length).toBe(6);
    });

    it("regenerates join code when requested by teacher", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
        status: "active",
      });
      (db.classroom.findFirst as any).mockResolvedValue(null);
      (db.classroom.update as any).mockImplementation(({ data }: any) => ({
        id: "c-1",
        teacherId: teacherUser.id,
        joinCode: data.joinCode,
      }));

      const regenerated = await regenerateJoinCode(teacherCtx, "c-1");
      expect(regenerated.success).toBe(true);
      expect(regenerated.joinCode).toBeDefined();
      expect(regenerated.joinCode.length).toBe(6);
    });

    it("allows a student to join via valid join code", async () => {
      (db.classroom.findFirst as any).mockResolvedValue({
        id: "c-1",
        name: "Chemistry 101",
        teacherId: teacherUser.id,
        status: "active",
      });
      (db.classroomStudent.findUnique as any).mockResolvedValue(null);
      (db.classroomStudent.create as any).mockResolvedValue({
        id: "cs-1",
        classroomId: "c-1",
        studentId: studentUser1.id,
        status: "active",
      });

      const joinResult = await joinClassroom(student1Ctx, "7KP9X2");
      expect(joinResult.success).toBe(true);
      expect(joinResult.classroom.id).toBe("c-1");
    });

    it("is idempotent when student joins multiple times", async () => {
      (db.classroom.findFirst as any).mockResolvedValue({
        id: "c-1",
        name: "Biology Lab",
        teacherId: teacherUser.id,
        status: "active",
      });
      (db.classroomStudent.findUnique as any).mockResolvedValue({
        id: "cs-1",
        classroomId: "c-1",
        studentId: studentUser1.id,
        status: "active",
      });

      const secondJoin = await joinClassroom(student1Ctx, "7KP9X2");
      expect(secondJoin.success).toBe(true);
      expect(secondJoin.alreadyEnrolled).toBe(true);
    });

    it("allows student to leave classroom", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
      });
      (db.classroomStudent.findUnique as any).mockResolvedValue({
        id: "cs-1",
        classroomId: "c-1",
        studentId: studentUser1.id,
        status: "active",
      });
      (db.classroomStudent.update as any).mockResolvedValue({
        id: "cs-1",
        status: "removed",
      });

      const leaveResult = await leaveClassroom(student1Ctx, "c-1");
      expect(leaveResult.success).toBe(true);
    });

    it("prevents teacher from leaving own classroom", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
      });

      await expect(leaveClassroom(teacherCtx, "c-1")).rejects.toThrow();
    });
  });

  describe("2. Student Invitation & Removal", () => {
    it("allows teacher to invite student by email", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
        status: "active",
      });
      (db.user.findUnique as any).mockResolvedValue(studentUser2);
      (db.classroomStudent.findUnique as any).mockResolvedValue(null);
      (db.classroomStudent.create as any).mockResolvedValue({
        id: "cs-2",
        classroomId: "c-1",
        studentId: studentUser2.id,
        status: "active",
        student: studentUser2,
      });

      const res = await inviteStudent(teacherCtx, "c-1", {
        email: studentUser2.email,
      });
      expect(res.success).toBe(true);
      expect(res.student.id).toBe(studentUser2.id);
    });

    it("allows teacher to remove student from classroom", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
      });
      (db.classroomStudent.findUnique as any).mockResolvedValue({
        id: "cs-1",
        classroomId: "c-1",
        studentId: studentUser1.id,
        status: "active",
      });
      (db.classroomStudent.update as any).mockResolvedValue({
        id: "cs-1",
        status: "removed",
      });

      const removeRes = await removeStudent(teacherCtx, "c-1", studentUser1.id);
      expect(removeRes.success).toBe(true);
    });
  });

  describe("3. Assignment Creation & Access Control", () => {
    it("creates an assignment linking assessment to classroom", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
        status: "active",
      });
      (db.assessment.findUnique as any).mockResolvedValue({
        id: "a-1",
        title: "Mechanics Assessment",
        status: "published",
      });
      (db.assignment.create as any).mockImplementation(({ data }: any) => ({
        id: "asg-1",
        ...data,
      }));

      const assignment = await createAssignment(teacherCtx, {
        classroomId: "c-1",
        assessmentId: "a-1",
        title: "Week 1 Mechanics Quiz",
        instructions: "Complete all questions before Sunday.",
        maxAttempts: 2,
        points: 100,
        status: "published",
      });

      expect(assignment.id).toBe("asg-1");
      expect(assignment.title).toBe("Week 1 Mechanics Quiz");
      expect(assignment.classroomId).toBe("c-1");
      expect(assignment.assessmentId).toBe("a-1");
    });

    it("rejects assignment creation by non-teacher", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
        status: "active",
      });

      await expect(
        createAssignment(student1Ctx, {
          classroomId: "c-1",
          assessmentId: "a-1",
        }),
      ).rejects.toThrow();
    });

    it("prevents non-enrolled students from taking the assignment", async () => {
      (db.assignment.findUnique as any).mockResolvedValue({
        id: "asg-1",
        classroomId: "c-1",
        status: "published",
        visibility: "published",
        maxAttempts: 1,
        classroom: {
          id: "c-1",
          teacherId: teacherUser.id,
          students: [], // outsider not enrolled
        },
      });

      await expect(startAssignmentAttempt(outsiderCtx, "asg-1")).rejects.toThrow();
    });
  });

  describe("4. Student Assessment Attempt & Grading Workflow", () => {
    const mockAssessment = {
      id: "a-1",
      title: "Geography Quiz",
      passingScore: 60,
      duration: 1800,
      status: "published",
      questions: [
        {
          id: "aq-1",
          questionId: "bq-1",
          order: 1,
          points: 10,
          question: {
            id: "bq-1",
            questionType: "multiple_choice",
            payload: JSON.stringify({
              prompt: "What is the capital of Uzbekistan?",
              options: [
                { id: "opt-1", text: "Tashkent", isCorrect: true },
                { id: "opt-2", text: "Samarkand", isCorrect: false },
              ],
            }),
          },
        },
      ],
    };

    const mockAssignmentWithAssessment = {
      id: "asg-1",
      classroomId: "c-1",
      assessmentId: "a-1",
      title: "Geography Assignment 1",
      status: "published",
      visibility: "published",
      maxAttempts: 2,
      points: 100,
      classroom: {
        id: "c-1",
        teacherId: teacherUser.id,
        students: [{ studentId: studentUser1.id, status: "active" }],
      },
      assessment: mockAssessment,
    };

    it("allows enrolled student to start and resume an attempt", async () => {
      (db.assignment.findUnique as any).mockResolvedValue(mockAssignmentWithAssessment);
      (db.assessmentAttempt.count as any).mockResolvedValue(0);
      (db.assessmentAttempt.findFirst as any).mockResolvedValue(null);
      (db.assessmentAttempt.create as any).mockResolvedValue({
        id: "att-1",
        assessmentId: "a-1",
        assignmentId: "asg-1",
        userId: studentUser1.id,
        status: "in_progress",
        attemptNumber: 1,
      });

      const startRes = await startAssignmentAttempt(student1Ctx, "asg-1");
      expect(startRes.attempt).toBeDefined();
      expect(startRes.resumed).toBe(false);
      expect(startRes.assessment.questions[0].payload.options[0].isCorrect).toBeUndefined();
    });

    it("grades correct student submission accurately", async () => {
      (db.assignment.findUnique as any).mockResolvedValue(mockAssignmentWithAssessment);
      (db.assessmentAttempt.findUnique as any).mockResolvedValue({
        id: "att-1",
        assessmentId: "a-1",
        assignmentId: "asg-1",
        userId: studentUser1.id,
        studentId: studentUser1.id,
        status: "in_progress",
        assessment: mockAssessment,
      });
      (db.assessmentResponse.upsert as any).mockResolvedValue({});
      (db.assessmentAttempt.update as any).mockImplementation(({ data }: any) => ({
        id: "att-1",
        ...data,
      }));

      const submitRes = await submitAssignmentAttempt(
        student1Ctx,
        "asg-1",
        "att-1",
        {
          responses: [
            {
              questionId: "bq-1",
              answer: "opt-1",
            },
          ],
        },
      );

      expect(submitRes.status).toBe("graded");
      expect(submitRes.score).toBe(100);
      expect(submitRes.pointsAwarded).toBe(10);
      expect(submitRes.passed).toBe(true);
    });

    it("enforces max attempts on assignment", async () => {
      (db.assignment.findUnique as any).mockResolvedValue({
        ...mockAssignmentWithAssessment,
        maxAttempts: 2,
      });
      (db.assessmentAttempt.findMany as any).mockResolvedValue([
        { id: "att-1", status: "graded" },
        { id: "att-2", status: "graded" },
      ]);
      (db.assessmentAttempt.findFirst as any).mockResolvedValue(null);

      await expect(startAssignmentAttempt(student1Ctx, "asg-1")).rejects.toThrow();
    });
  });

  describe("5. Classroom Analytics & Summaries", () => {
    it("computes classroom analytics with student completion rates", async () => {
      (db.classroom.findUnique as any).mockResolvedValue({
        id: "c-1",
        teacherId: teacherUser.id,
        students: [
          { studentId: studentUser1.id, status: "active" },
          { studentId: studentUser2.id, status: "active" },
        ],
        assignments: [
          {
            id: "asg-1",
            title: "Quiz 1",
            points: 100,
            attempts: [],
          },
        ],
      });
      (db.assessmentAttempt.findMany as any).mockResolvedValue([]);

      const analytics = await getClassroomAnalytics(teacherCtx, "c-1");
      expect(analytics.totalStudents).toBe(2);
      expect(analytics.activeStudents).toBe(2);
      expect(analytics.totalAssignments).toBe(1);
      expect(analytics.completedSubmissions).toBe(0);
    });
  });
});
