import { z } from "zod";
import { db } from "@/lib/db";
import { recordAssignmentGrade } from "@/features/gradebook";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
} from "@/lib/errors";
import { type AuthContext } from "@/features/auth";
import { sanitizeAssessmentForStudent } from "@/features/assessment";

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

export const createAssignmentBodySchema = z.object({
  classroomId: z.string().min(1, "Classroom ID is required"),
  assessmentId: z.string().min(1, "Assessment ID is required"),
  title: z.string().max(200).optional(),
  instructions: z.string().max(2000).optional().nullable(),
  opensAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(), // alias for compatibility
  maxAttempts: z.number().int().min(1).max(100).default(1),
  allowLate: z.boolean().default(true),
  points: z.number().int().min(1).default(100),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  visibility: z.enum(["draft", "published", "archived"]).optional(),
});
export type CreateAssignmentBody = z.infer<typeof createAssignmentBodySchema>;

export const updateAssignmentBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  instructions: z.string().max(2000).optional().nullable(),
  opensAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  maxAttempts: z.number().int().min(1).max(100).optional(),
  allowLate: z.boolean().optional(),
  points: z.number().int().min(1).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["draft", "published", "archived"]).optional(),
});
export type UpdateAssignmentBody = z.infer<typeof updateAssignmentBodySchema>;

export const duplicateAssignmentBodySchema = z.object({
  targetClassroomId: z.string().optional(),
  title: z.string().optional(),
});
export type DuplicateAssignmentBody = z.infer<typeof duplicateAssignmentBodySchema>;

export const submitAssignmentAttemptBodySchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.any(),
      timeSpentMs: z.number().optional(),
    }),
  ),
});
export type SubmitAssignmentAttemptBody = z.infer<typeof submitAssignmentAttemptBodySchema>;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function extractUserId(authCtx: any): string {
  const uid = authCtx?.userId || authCtx?.user?.id;
  if (!uid) throw unauthorized("Authentication required");
  return uid;
}

function isUserAdmin(authCtx: any): boolean {
  if (!authCtx) return false;
  if (authCtx.user?.role === "admin" || authCtx.user?.role === "ADMIN") return true;
  if (Array.isArray(authCtx.platformRoles) && authCtx.platformRoles.includes("ADMIN")) return true;
  return false;
}

// -----------------------------------------------------------------------------
// Service Methods
// -----------------------------------------------------------------------------

/**
 * Create an assignment linking an assessment to a classroom.
 */
export async function createAssignment(authCtx: AuthContext, body: CreateAssignmentBody) {
  const userId = extractUserId(authCtx);

  // 1. Verify classroom
  const classroom = await db.classroom.findUnique({
    where: { id: body.classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can create assignments");
  }

  if (classroom.status === "archived") {
    throw badRequest("Cannot create assignments in an archived classroom");
  }

  // 2. Verify assessment
  const assessment = await db.assessment.findUnique({
    where: { id: body.assessmentId },
    include: { questions: true },
  });
  if (!assessment) throw notFound("Assessment not found");

  if (assessment.ownerId !== userId && !isUserAdmin(authCtx) && assessment.status !== "published") {
    throw forbidden("Assessment is not accessible or not published");
  }

  // 3. Date validation
  const effectiveOpensAt = body.opensAt ? new Date(body.opensAt) : null;
  const effectiveDueAt = body.dueAt ? new Date(body.dueAt) : body.dueDate ? new Date(body.dueDate) : null;

  if (effectiveOpensAt && effectiveDueAt && effectiveDueAt <= effectiveOpensAt) {
    throw badRequest("Due date must be after the start/open date");
  }

  // Title snapshot
  const assignmentTitle = (body.title?.trim() || assessment.title).trim();
  const visibilityStatus = body.visibility || body.status || "published";

  const assignment = await db.assignment.create({
    data: {
      classroomId: classroom.id,
      assessmentId: assessment.id,
      teacherId: userId,
      title: assignmentTitle,
      instructions: body.instructions?.trim() || null,
      opensAt: effectiveOpensAt,
      dueAt: effectiveDueAt,
      dueDate: effectiveDueAt,
      maxAttempts: body.maxAttempts ?? 1,
      allowLate: body.allowLate ?? true,
      points: body.points ?? 100,
      status: visibilityStatus === "archived" ? "archived" : "active",
      visibility: visibilityStatus,
      publishedAt: visibilityStatus === "published" ? new Date() : null,
    },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          assessmentType: true,
          duration: true,
          passingScore: true,
          maxAttempts: true,
        },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          grade: true,
        },
      },
    },
  });

  return assignment;
}

/**
 * List assignments for a classroom (returns full stats for teacher, personal attempt status for student).
 */
export async function listAssignmentsByClassroom(authCtx: AuthContext, classroomId: string) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    include: {
      students: { where: { status: "active" } },
    },
  });
  if (!classroom) throw notFound("Classroom not found");

  const isTeacher = classroom.teacherId === userId || isUserAdmin(authCtx);
  const isEnrolled = classroom.students.some((s) => s.studentId === userId);

  if (!isTeacher && !isEnrolled) {
    throw forbidden("You are not a member of this classroom");
  }

  if (isTeacher) {
    const assignments = await db.assignment.findMany({
      where: {
        classroomId,
        status: { not: "archived" },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            assessmentType: true,
            duration: true,
            passingScore: true,
            maxAttempts: true,
          },
        },
        assessmentAttempts: {
          select: {
            id: true,
            studentId: true,
            status: true,
            score: true,
            passed: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const activeStudentCount = classroom.students.length;

    return assignments.map((a) => {
      const studentAttemptMap = new Map<string, typeof a.assessmentAttempts>();
      a.assessmentAttempts.forEach((att) => {
        const list = studentAttemptMap.get(att.studentId) || [];
        list.push(att);
        studentAttemptMap.set(att.studentId, list);
      });

      const startedCount = studentAttemptMap.size;
      const completedAttempts = a.assessmentAttempts.filter(
        (att) => att.status === "graded" || att.status === "submitted",
      );
      const completedStudentIds = new Set(completedAttempts.map((att) => att.studentId));
      const completedCount = completedStudentIds.size;

      const scores = completedAttempts.map((att) => att.score ?? 0);
      const averageScore = scores.length > 0
        ? Math.round((scores.reduce((s, c) => s + c, 0) / scores.length) * 100) / 100
        : 0;

      const passedCount = completedAttempts.filter((att) => att.passed === true).length;
      const passRate = completedAttempts.length > 0
        ? Math.round((passedCount / completedAttempts.length) * 100)
        : 0;

      return {
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        opensAt: a.opensAt,
        dueAt: a.dueAt || a.dueDate,
        dueDate: a.dueAt || a.dueDate,
        maxAttempts: a.maxAttempts,
        allowLate: a.allowLate,
        points: a.points,
        status: a.status,
        visibility: a.visibility,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        assessment: a.assessment,
        stats: {
          assignedCount: activeStudentCount,
          startedCount,
          completedCount,
          averageScore,
          passRate,
        },
      };
    });
  } else {
    // Student View
    const assignments = await db.assignment.findMany({
      where: {
        classroomId,
        status: { in: ["active", "published"] },
        visibility: { not: "draft" },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            assessmentType: true,
            duration: true,
            passingScore: true,
          },
        },
        assessmentAttempts: {
          where: { studentId: userId },
          orderBy: { attemptNumber: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    return assignments.map((a) => {
      const attempts = a.assessmentAttempts;
      const activeAttempt = attempts.find(
        (att) => att.status === "in_progress" || att.status === "paused",
      );
      const completedAttempts = attempts.filter(
        (att) => att.status === "graded" || att.status === "submitted",
      );
      const bestScore = completedAttempts.length > 0
        ? Math.max(...completedAttempts.map((att) => att.score ?? 0))
        : null;
      const latestAttempt = attempts[0] || null;
      const effectiveDue = a.dueAt || a.dueDate;

      let studentStatus = "AVAILABLE";
      if (a.opensAt && now < a.opensAt) {
        studentStatus = "UPCOMING";
      } else if (activeAttempt) {
        studentStatus = "IN_PROGRESS";
      } else if (attempts.length >= a.maxAttempts || completedAttempts.length >= a.maxAttempts) {
        studentStatus = "COMPLETED";
      } else if (effectiveDue && now > effectiveDue) {
        studentStatus = a.allowLate ? "AVAILABLE" : "OVERDUE";
      }

      return {
        id: a.id,
        title: a.title,
        instructions: a.instructions,
        opensAt: a.opensAt,
        dueAt: effectiveDue,
        dueDate: effectiveDue,
        maxAttempts: a.maxAttempts,
        allowLate: a.allowLate,
        points: a.points,
        status: a.status,
        studentStatus,
        attemptsUsed: attempts.length,
        bestScore,
        latestScore: latestAttempt?.score ?? null,
        passed: latestAttempt?.passed ?? null,
        activeAttemptId: activeAttempt?.id ?? null,
        assessment: a.assessment,
      };
    });
  }
}

/**
 * Get detailed assignment view with attempts & assessment metadata.
 */
export async function getAssignment(authCtx: AuthContext, assignmentId: string) {
  const userId = extractUserId(authCtx);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      classroom: {
        include: {
          teacher: {
            select: { id: true, name: true, username: true, email: true, avatarUrl: true },
          },
          students: {
            where: { status: "active" },
            include: {
              student: {
                select: { id: true, name: true, username: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
      assessment: {
        include: {
          questions: {
            include: { question: true },
            orderBy: { order: "asc" },
          },
        },
      },
      assessmentAttempts: {
        include: {
          student: {
            select: { id: true, name: true, username: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { attemptNumber: "desc" },
      },
    },
  });

  if (!assignment) throw notFound("Assignment not found");

  const isTeacher = assignment.classroom.teacherId === userId || isUserAdmin(authCtx);
  const isEnrolled = assignment.classroom.students.some((s) => s.studentId === userId);

  if (!isTeacher && !isEnrolled) {
    throw forbidden("You are not authorized to view this assignment");
  }

  const effectiveDue = assignment.dueAt || assignment.dueDate;
  const now = new Date();

  if (isTeacher) {
    // Build student roster submission report
    const studentResults = assignment.classroom.students.map((member) => {
      const studentAttempts = assignment.assessmentAttempts.filter(
        (att) => att.studentId === member.studentId,
      );
      const activeAttempt = studentAttempts.find(
        (att) => att.status === "in_progress" || att.status === "paused",
      );
      const completedAttempts = studentAttempts.filter(
        (att) => att.status === "graded" || att.status === "submitted",
      );
      const bestScore = completedAttempts.length > 0
        ? Math.max(...completedAttempts.map((att) => att.score ?? 0))
        : null;
      const latestAttempt = studentAttempts[0] || null;

      let status = "NOT_STARTED";
      if (activeAttempt) {
        status = "IN_PROGRESS";
      } else if (completedAttempts.length > 0) {
        status = "COMPLETED";
      } else if (effectiveDue && now > effectiveDue) {
        status = "OVERDUE";
      }

      return {
        student: member.student,
        status,
        attemptsCount: studentAttempts.length,
        bestScore,
        latestScore: latestAttempt?.score ?? null,
        passed: latestAttempt?.passed ?? null,
        lastSubmittedAt: latestAttempt?.submittedAt ?? null,
        attempts: studentAttempts.map((att) => ({
          id: att.id,
          attemptNumber: att.attemptNumber,
          status: att.status,
          score: att.score,
          pointsAwarded: att.pointsAwarded,
          pointsMax: att.pointsMax,
          passed: att.passed,
          startedAt: att.startedAt,
          submittedAt: att.submittedAt,
        })),
      };
    });

    return {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      opensAt: assignment.opensAt,
      dueAt: effectiveDue,
      dueDate: effectiveDue,
      maxAttempts: assignment.maxAttempts,
      allowLate: assignment.allowLate,
      points: assignment.points,
      status: assignment.status,
      visibility: assignment.visibility,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      isTeacher: true,
      classroom: {
        id: assignment.classroom.id,
        name: assignment.classroom.name,
        subject: assignment.classroom.subject,
        grade: assignment.classroom.grade,
      },
      assessment: assignment.assessment ? {
        id: assignment.assessment.id,
        title: assignment.assessment.title,
        assessmentType: assignment.assessment.assessmentType,
        duration: assignment.assessment.duration,
        passingScore: assignment.assessment.passingScore,
        totalQuestions: assignment.assessment.questions.length,
      } : null,
      studentSubmissions: studentResults,
    };
  } else {
    // Student View
    const studentAttempts = assignment.assessmentAttempts.filter(
      (att) => att.studentId === userId,
    );
    const activeAttempt = studentAttempts.find(
      (att) => att.status === "in_progress" || att.status === "paused",
    );
    const completedAttempts = studentAttempts.filter(
      (att) => att.status === "graded" || att.status === "submitted",
    );
    const bestScore = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map((att) => att.score ?? 0))
      : null;
    const latestAttempt = studentAttempts[0] || null;

    let studentStatus = "AVAILABLE";
    if (assignment.opensAt && now < assignment.opensAt) {
      studentStatus = "UPCOMING";
    } else if (activeAttempt) {
      studentStatus = "IN_PROGRESS";
    } else if (studentAttempts.length >= assignment.maxAttempts || completedAttempts.length >= assignment.maxAttempts) {
      studentStatus = "COMPLETED";
    } else if (effectiveDue && now > effectiveDue) {
      studentStatus = assignment.allowLate ? "AVAILABLE" : "OVERDUE";
    }

    return {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      opensAt: assignment.opensAt,
      dueAt: effectiveDue,
      dueDate: effectiveDue,
      maxAttempts: assignment.maxAttempts,
      allowLate: assignment.allowLate,
      points: assignment.points,
      status: assignment.status,
      studentStatus,
      isTeacher: false,
      classroom: {
        id: assignment.classroom.id,
        name: assignment.classroom.name,
        teacher: assignment.classroom.teacher,
      },
      assessment: assignment.assessment ? {
        id: assignment.assessment.id,
        title: assignment.assessment.title,
        assessmentType: assignment.assessment.assessmentType,
        duration: assignment.assessment.duration,
        passingScore: assignment.assessment.passingScore,
        totalQuestions: assignment.assessment.questions.length,
      } : null,
      attemptsUsed: studentAttempts.length,
      bestScore,
      latestScore: latestAttempt?.score ?? null,
      passed: latestAttempt?.passed ?? null,
      activeAttempt: activeAttempt ? {
        id: activeAttempt.id,
        attemptNumber: activeAttempt.attemptNumber,
        status: activeAttempt.status,
        startedAt: activeAttempt.startedAt,
        expiresAt: activeAttempt.expiresAt,
      } : null,
      attempts: studentAttempts.map((att) => ({
        id: att.id,
        attemptNumber: att.attemptNumber,
        status: att.status,
        score: att.score,
        pointsAwarded: att.pointsAwarded,
        pointsMax: att.pointsMax,
        passed: att.passed,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
      })),
    };
  }
}

/**
 * Update assignment (teacher only).
 */
export async function updateAssignment(
  authCtx: AuthContext,
  assignmentId: string,
  body: UpdateAssignmentBody,
) {
  const userId = extractUserId(authCtx);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { classroom: true },
  });
  if (!assignment) throw notFound("Assignment not found");

  if (assignment.teacherId !== userId && assignment.classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can update this assignment");
  }

  const effectiveOpensAt = body.opensAt !== undefined
    ? (body.opensAt ? new Date(body.opensAt) : null)
    : assignment.opensAt;

  const effectiveDueAt = body.dueAt !== undefined || body.dueDate !== undefined
    ? (body.dueAt ? new Date(body.dueAt) : body.dueDate ? new Date(body.dueDate) : null)
    : (assignment.dueAt || assignment.dueDate);

  if (effectiveOpensAt && effectiveDueAt && effectiveDueAt <= effectiveOpensAt) {
    throw badRequest("Due date must be after the start/open date");
  }

  const updated = await db.assignment.update({
    where: { id: assignmentId },
    data: {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.instructions !== undefined ? { instructions: body.instructions?.trim() || null } : {}),
      ...(body.opensAt !== undefined ? { opensAt: effectiveOpensAt } : {}),
      ...(body.dueAt !== undefined || body.dueDate !== undefined ? { dueAt: effectiveDueAt, dueDate: effectiveDueAt } : {}),
      ...(body.maxAttempts !== undefined ? { maxAttempts: body.maxAttempts } : {}),
      ...(body.allowLate !== undefined ? { allowLate: body.allowLate } : {}),
      ...(body.points !== undefined ? { points: body.points } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
    },
    include: {
      assessment: {
        select: { id: true, title: true, assessmentType: true },
      },
    },
  });

  return updated;
}

/**
 * Archive an assignment (teacher only).
 */
export async function archiveAssignment(authCtx: AuthContext, assignmentId: string) {
  const userId = extractUserId(authCtx);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { classroom: true },
  });
  if (!assignment) throw notFound("Assignment not found");

  if (assignment.teacherId !== userId && assignment.classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can archive this assignment");
  }

  const archived = await db.assignment.update({
    where: { id: assignmentId },
    data: { status: "archived", visibility: "archived" },
  });

  return {
    success: true,
    message: "Assignment archived successfully",
    assignment: archived,
  };
}

/**
 * Publish a draft assignment (teacher only).
 */
export async function publishAssignment(authCtx: AuthContext, assignmentId: string) {
  const userId = extractUserId(authCtx);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { classroom: true },
  });
  if (!assignment) throw notFound("Assignment not found");

  if (assignment.teacherId !== userId && assignment.classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can publish this assignment");
  }

  const published = await db.assignment.update({
    where: { id: assignmentId },
    data: {
      status: "active",
      visibility: "published",
      publishedAt: new Date(),
    },
  });

  return {
    success: true,
    message: "Assignment published successfully",
    assignment: published,
  };
}

/**
 * Duplicate assignment (teacher only).
 */
export async function duplicateAssignment(
  authCtx: AuthContext,
  assignmentId: string,
  body?: DuplicateAssignmentBody,
) {
  const userId = extractUserId(authCtx);

  const original = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { classroom: true },
  });
  if (!original) throw notFound("Assignment not found");

  if (original.teacherId !== userId && original.classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can duplicate this assignment");
  }

  const targetClassroomId = body?.targetClassroomId || original.classroomId;

  const duplicated = await db.assignment.create({
    data: {
      classroomId: targetClassroomId,
      assessmentId: original.assessmentId,
      teacherId: userId,
      title: body?.title || `${original.title} (Copy)`,
      instructions: original.instructions,
      opensAt: original.opensAt,
      dueAt: original.dueAt,
      dueDate: original.dueDate,
      maxAttempts: original.maxAttempts,
      allowLate: original.allowLate,
      points: original.points,
      status: "draft",
      visibility: "draft",
    },
  });

  return duplicated;
}

/**
 * Start or resume an attempt on an assignment (student workflow).
 */
export async function startAssignmentAttempt(authCtx: AuthContext, assignmentId: string) {
  const userId = extractUserId(authCtx);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      classroom: {
        include: {
          students: { where: { status: "active" } },
        },
      },
      assessment: {
        include: {
          questions: {
            include: { question: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!assignment) throw notFound("Assignment not found");
  if (!assignment.assessment) throw notFound("Underlying assessment not found");

  if (assignment.classroom.status === "archived") {
    throw badRequest("Classroom is archived");
  }

  const isTeacher = assignment.classroom.teacherId === userId || isUserAdmin(authCtx);
  const isEnrolled = assignment.classroom.students.some((s) => s.studentId === userId);

  if (!isTeacher && !isEnrolled) {
    throw forbidden("You must be enrolled in this classroom to take this assignment");
  }

  if (assignment.status === "archived" || assignment.visibility === "draft") {
    if (!isTeacher) throw forbidden("Assignment is not active or available");
  }

  const now = new Date();

  // Validate start date
  if (assignment.opensAt && now < assignment.opensAt && !isTeacher) {
    throw badRequest("Assignment is not open yet");
  }

  // Validate due date
  const effectiveDue = assignment.dueAt || assignment.dueDate;
  if (effectiveDue && now > effectiveDue && !assignment.allowLate && !isTeacher) {
    throw badRequest("Assignment deadline has passed and late submissions are not allowed");
  }

  // Query existing attempts for this assignment & student
  const existingAttempts = (await db.assessmentAttempt.findMany({
    where: {
      assignmentId,
      studentId: userId,
    },
    orderBy: { attemptNumber: "desc" },
  })) || [];

  // Check for active attempt to resume
  const activeAttempt = existingAttempts.find(
    (a) => a.status === "in_progress" || a.status === "paused",
  );

  if (activeAttempt) {
    return {
      attempt: activeAttempt,
      resumed: true,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        dueAt: effectiveDue,
        points: assignment.points,
      },
      assessment: sanitizeAssessmentForStudent(assignment.assessment),
    };
  }

  // Check attempt limit
  if (existingAttempts.length >= assignment.maxAttempts && !isTeacher) {
    throw conflict("Maximum number of attempts reached for this assignment");
  }

  // Question shuffle
  let orderedQuestionIds = assignment.assessment.questions.map((q) => q.questionId);
  if (assignment.assessment.shuffleQuestions) {
    orderedQuestionIds = [...orderedQuestionIds].sort(() => Math.random() - 0.5);
  }

  const expiresAt = assignment.assessment.duration
    ? new Date(Date.now() + assignment.assessment.duration * 1000)
    : null;

  const totalMaxPoints = assignment.assessment.questions.reduce((sum, q) => sum + (q.points || 1), 0);

  const attempt = await db.assessmentAttempt.create({
    data: {
      assessmentId: assignment.assessment.id,
      assignmentId: assignment.id,
      studentId: userId,
      attemptNumber: existingAttempts.length + 1,
      status: "in_progress",
      expiresAt,
      pointsMax: totalMaxPoints,
      questionOrder: JSON.stringify(orderedQuestionIds),
    },
  });

  return {
    attempt,
    resumed: false,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      dueAt: effectiveDue,
      points: assignment.points,
    },
    assessment: sanitizeAssessmentForStudent(assignment.assessment),
  };
}

// Alias for startAssignmentAttempt
export const startAssignment = startAssignmentAttempt;

/**
 * Submit responses for an assignment attempt.
 */
export async function submitAssignmentAttempt(
  authCtx: AuthContext,
  assignmentId: string,
  attemptId: string,
  body: SubmitAssignmentAttemptBody,
) {
  const userId = extractUserId(authCtx);

  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          questions: {
            include: { question: true },
          },
        },
      },
      assignment: true,
    },
  });

  if (!attempt) throw notFound("Attempt not found");
  if (attempt.assignmentId !== assignmentId) {
    throw badRequest("Attempt does not belong to this assignment");
  }

  const isOwner = attempt.studentId === userId || attempt.userId === userId;
  if (!isOwner && !isUserAdmin(authCtx)) {
    throw forbidden("You cannot submit an attempt on behalf of another student");
  }

  if (attempt.status === "submitted" || attempt.status === "graded") {
    throw conflict("This attempt has already been submitted");
  }

  // Grade responses
  const questionsMap = new Map(attempt.assessment.questions.map((aq) => [aq.questionId, aq]));
  let totalPointsAwarded = 0;
  let totalPointsMax = 0;

  for (const respInput of body.responses) {
    const aq = questionsMap.get(respInput.questionId);
    if (!aq) continue;

    const question = aq.question;
    const maxPoints = aq.points || 1;
    totalPointsMax += maxPoints;

    let parsedPayload: any = {};
    try {
      parsedPayload = typeof question.payload === "string" ? JSON.parse(question.payload) : question.payload;
    } catch {
      parsedPayload = {};
    }

    let isCorrect = false;
    let pointsAwarded = 0;

    if (question.questionType === "multiple_choice" || question.questionType === "mcq") {
      const correctOpt = parsedPayload.options?.find((o: any) => o.isCorrect);
      if (correctOpt && String(respInput.answer) === String(correctOpt.id)) {
        isCorrect = true;
        pointsAwarded = maxPoints;
      }
    } else if (question.questionType === "true_false") {
      if (String(respInput.answer).toLowerCase() === String(parsedPayload.correctAnswer).toLowerCase()) {
        isCorrect = true;
        pointsAwarded = maxPoints;
      }
    } else if (question.questionType === "short_answer") {
      const studentAns = String(respInput.answer || "").trim().toLowerCase();
      const expectedAns = String(parsedPayload.correctAnswer || "").trim().toLowerCase();
      if (studentAns === expectedAns) {
        isCorrect = true;
        pointsAwarded = maxPoints;
      }
    }

    totalPointsAwarded += pointsAwarded;

    await db.assessmentResponse.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: question.id,
        },
      },
      update: {
        answer: JSON.stringify(respInput.answer),
        isCorrect,
        pointsAwarded,
        pointsMax: maxPoints,
        timeSpentMs: respInput.timeSpentMs || 0,
      },
      create: {
        attemptId: attempt.id,
        questionId: question.id,
        answer: JSON.stringify(respInput.answer),
        isCorrect,
        pointsAwarded,
        pointsMax: maxPoints,
        timeSpentMs: respInput.timeSpentMs || 0,
      },
    });
  }

  const scorePct = totalPointsMax > 0 ? (totalPointsAwarded / totalPointsMax) * 100 : 100;
  const passingScore = attempt.assessment.passingScore ?? 60;
  const passed = scorePct >= passingScore;

  const gradedAttempt = await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "graded",
      submittedAt: new Date(),
      gradedAt: new Date(),
      autoGradedAt: new Date(),
      score: Math.round(scorePct * 100) / 100,
      pointsAwarded: totalPointsAwarded,
      pointsMax: totalPointsMax,
      passed,
    },
    include: {
      responses: true,
    },
  });

  await recordAssignmentGrade({
    classroomId: attempt.assignment?.classroomId,
    studentId: attempt.studentId || attempt.userId,
    assignmentId,
    attemptId: attempt.id,
    assessmentAttemptId: attempt.id,
    title: attempt.assignment?.title || attempt.assessment.title,
    points: totalPointsAwarded,
    maxPoints: totalPointsMax,
    percentage: Math.round(scorePct * 100) / 100,
    passed,
  }).catch((err) => console.error("[gradebook] record failed", err));

  return gradedAttempt;
}

/**
 * Get assignment analytics (teacher only).
 */
export async function getAssignmentAnalytics(authCtx: AuthContext, assignmentId: string) {
  const userId = extractUserId(authCtx);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      classroom: {
        include: {
          students: {
            where: { status: "active" },
            include: {
              student: {
                select: { id: true, name: true, username: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
      assessment: {
        select: { id: true, title: true, passingScore: true, duration: true },
      },
      assessmentAttempts: {
        include: {
          student: {
            select: { id: true, name: true, username: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { attemptNumber: "desc" },
      },
    },
  });

  if (!assignment) throw notFound("Assignment not found");

  if (assignment.teacherId !== userId && assignment.classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can view assignment analytics");
  }

  const activeStudents = assignment.classroom.students;
  const totalAssigned = activeStudents.length;

  const studentAttemptMap = new Map<string, typeof assignment.assessmentAttempts>();
  assignment.assessmentAttempts.forEach((att) => {
    const list = studentAttemptMap.get(att.studentId) || [];
    list.push(att);
    studentAttemptMap.set(att.studentId, list);
  });

  const startedCount = studentAttemptMap.size;
  const completedAttempts = assignment.assessmentAttempts.filter(
    (att) => att.status === "graded" || att.status === "submitted",
  );
  const completedCount = new Set(completedAttempts.map((att) => att.studentId)).size;

  const scores = completedAttempts.map((att) => att.score ?? 0);
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((s, c) => s + c, 0) / scores.length) * 100) / 100
    : 0;

  const passedCount = completedAttempts.filter((att) => att.passed === true).length;
  const passRate = completedAttempts.length > 0
    ? Math.round((passedCount / completedAttempts.length) * 100)
    : 0;

  const effectiveDue = assignment.dueAt || assignment.dueDate;
  const now = new Date();

  const studentBreakdown = activeStudents.map((member) => {
    const attempts = studentAttemptMap.get(member.studentId) || [];
    const activeAttempt = attempts.find(
      (att) => att.status === "in_progress" || att.status === "paused",
    );
    const completed = attempts.filter(
      (att) => att.status === "graded" || att.status === "submitted",
    );
    const bestScore = completed.length > 0
      ? Math.max(...completed.map((att) => att.score ?? 0))
      : null;
    const latestAttempt = attempts[0] || null;

    let status = "not_started";
    if (activeAttempt) status = "in_progress";
    else if (completed.length > 0) status = "completed";
    else if (effectiveDue && now > effectiveDue) status = "overdue";

    return {
      student: member.student,
      status,
      attemptsUsed: attempts.length,
      maxAttempts: assignment.maxAttempts,
      bestScore,
      passed: latestAttempt?.passed ?? null,
      submittedAt: latestAttempt?.submittedAt ?? null,
    };
  });

  return {
    assignmentId: assignment.id,
    title: assignment.title,
    totalAssigned,
    startedCount,
    completedCount,
    averageScore,
    passRate,
    studentBreakdown,
  };
}
