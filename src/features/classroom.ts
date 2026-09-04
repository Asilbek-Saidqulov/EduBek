import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
} from "@/lib/errors";
import { type AuthContext } from "@/features/auth";

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

export const createClassroomBodySchema = z.object({
  name: z.string().min(1, "Classroom name is required").max(200),
  description: z.string().max(1000).optional().nullable(),
  subject: z.string().max(100).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  orgId: z.string().optional().nullable(),
});
export type CreateClassroomBody = z.infer<typeof createClassroomBodySchema>;

export const updateClassroomBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  subject: z.string().max(100).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
});
export type UpdateClassroomBody = z.infer<typeof updateClassroomBodySchema>;

export const joinClassroomBodySchema = z.object({
  joinCode: z.string().min(1, "Join code is required").max(30),
});
export type JoinClassroomBody = z.infer<typeof joinClassroomBodySchema>;

export const inviteStudentBodySchema = z.object({
  email: z.string().email().optional(),
  studentId: z.string().optional(),
  username: z.string().optional(),
}).refine((data) => data.email || data.studentId || data.username, {
  message: "Provide either student email, studentId, or username",
});
export type InviteStudentBody = z.infer<typeof inviteStudentBodySchema>;

export const removeStudentBodySchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});
export type RemoveStudentBody = z.infer<typeof removeStudentBodySchema>;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function extractUserId(authCtx: any): string {
  const uid = authCtx?.userId || authCtx?.user?.id;
  if (!uid) throw unauthorized("Authentication required");
  return uid;
}

export function isUserAdmin(authCtx: any): boolean {
  if (!authCtx) return false;
  if (authCtx.user?.role === "admin" || authCtx.user?.role === "ADMIN") return true;
  if (Array.isArray(authCtx.platformRoles) && authCtx.platformRoles.includes("ADMIN")) return true;
  return false;
}

export function generateRandomJoinCode(): string {
  // Generate a random 6-character uppercase alphanumeric code (avoiding ambiguous chars 0/O, 1/I)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

// -----------------------------------------------------------------------------
// Service Methods
// -----------------------------------------------------------------------------

/**
 * Create a new classroom.
 */
export async function createClassroom(authCtx: AuthContext, body: CreateClassroomBody) {
  const userId = extractUserId(authCtx);

  // Generate unique join code
  let joinCode = generateRandomJoinCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.classroom.findUnique({
      where: { joinCode },
    });
    if (!existing) break;
    joinCode = generateRandomJoinCode();
    attempts++;
  }

  const classroom = await db.classroom.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      subject: body.subject?.trim() || null,
      grade: body.grade?.trim() || null,
      joinCode,
      teacherId: userId,
      orgId: body.orgId || null,
      status: "active",
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return {
    ...classroom,
    studentCount: 0,
    assignmentCount: 0,
    isTeacher: true,
  };
}

/**
 * List all classrooms the current user is associated with (taught or enrolled).
 */
export async function listMyClassrooms(authCtx: AuthContext) {
  const userId = extractUserId(authCtx);

  // 1. Classrooms taught by user
  const taughtClassrooms = await db.classroom.findMany({
    where: {
      teacherId: userId,
    },
    include: {
      teacher: {
        select: { id: true, name: true, username: true, email: true, avatarUrl: true },
      },
      _count: {
        select: {
          students: { where: { status: "active" } },
          assignments: { where: { status: { not: "archived" } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Classrooms enrolled as student
  const studentMemberships = await db.classroomStudent.findMany({
    where: {
      studentId: userId,
      status: "active",
    },
    include: {
      classroom: {
        include: {
          teacher: {
            select: { id: true, name: true, username: true, email: true, avatarUrl: true },
          },
          _count: {
            select: {
              students: { where: { status: "active" } },
              assignments: { where: { status: "active" } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const taughtList = taughtClassrooms.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    subject: c.subject,
    grade: c.grade,
    joinCode: c.joinCode,
    teacherId: c.teacherId,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    teacher: c.teacher,
    studentCount: c._count.students,
    assignmentCount: c._count.assignments,
    isTeacher: true,
  }));

  const enrolledList = studentMemberships
    .filter((m) => m.classroom && m.classroom.teacherId !== userId)
    .map((m) => ({
      id: m.classroom.id,
      name: m.classroom.name,
      description: m.classroom.description,
      subject: m.classroom.subject,
      grade: m.classroom.grade,
      teacherId: m.classroom.teacherId,
      status: m.classroom.status,
      createdAt: m.classroom.createdAt,
      updatedAt: m.classroom.updatedAt,
      teacher: m.classroom.teacher,
      studentCount: m.classroom._count.students,
      assignmentCount: m.classroom._count.assignments,
      isTeacher: false,
      joinedAt: m.joinedAt,
    }));

  return [...taughtList, ...enrolledList];
}

/**
 * Get classroom details by ID.
 * Returns student list & stats for teacher; returns personalized assignment status for student.
 */
export async function getClassroom(authCtx: AuthContext, classroomId: string) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
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
        orderBy: { joinedAt: "asc" },
      },
      assignments: {
        where: { status: { not: "archived" } },
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
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!classroom) throw notFound("Classroom not found");

  const isTeacher = classroom.teacherId === userId || isUserAdmin(authCtx);
  const isEnrolled = classroom.students.some((s) => s.studentId === userId);

  if (!isTeacher && !isEnrolled) {
    throw forbidden("You are not a member of this classroom");
  }

  // If student, sanitize and inject student attempt status for each assignment
  let formattedAssignments: any[] = [];

  if (isTeacher) {
    formattedAssignments = classroom.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      opensAt: a.opensAt,
      dueAt: a.dueAt || a.dueDate,
      maxAttempts: a.maxAttempts,
      allowLate: a.allowLate,
      points: a.points,
      status: a.status,
      assessmentId: a.assessmentId,
      assessment: a.assessment,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  } else {
    // For student: query student's attempts for each assignment in this classroom
    const assessmentIds = classroom.assignments.map((a) => a.assessmentId).filter(Boolean) as string[];
    const studentAttempts = await db.assessmentAttempt.findMany({
      where: {
        assessmentId: { in: assessmentIds },
        studentId: userId,
      },
      include: {
        student: { select: { id: true, name: true, username: true } },
        assessment: { select: { title: true } },
      },
      orderBy: { attemptNumber: "desc" },
    });

    const now = new Date();

    formattedAssignments = classroom.assignments
      .filter((a) => a.status === "active" || a.status === "published")
      .map((a) => {
        const attempts = studentAttempts.filter((att) => att.assessmentId === a.assessmentId);
        const activeAttempt = attempts.find((att) => att.status === "in_progress" || att.status === "paused");
        const completedAttempts = attempts.filter((att) => att.status === "graded" || att.status === "submitted");
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

  return {
    id: classroom.id,
    name: classroom.name,
    description: classroom.description,
    subject: classroom.subject,
    grade: classroom.grade,
    joinCode: isTeacher ? classroom.joinCode : undefined,
    teacherId: classroom.teacherId,
    status: classroom.status,
    createdAt: classroom.createdAt,
    updatedAt: classroom.updatedAt,
    teacher: classroom.teacher,
    isTeacher,
    students: isTeacher ? classroom.students : undefined,
    studentCount: classroom.students.length,
    assignmentCount: classroom.assignments.length,
    assignments: formattedAssignments,
  };
}

/**
 * Update classroom details (teacher only).
 */
export async function updateClassroom(
  authCtx: AuthContext,
  classroomId: string,
  body: UpdateClassroomBody,
) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can update this classroom");
  }

  const updated = await db.classroom.update({
    where: { id: classroomId },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
      ...(body.subject !== undefined ? { subject: body.subject?.trim() || null } : {}),
      ...(body.grade !== undefined ? { grade: body.grade?.trim() || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: {
      teacher: {
        select: { id: true, name: true, username: true, email: true, avatarUrl: true },
      },
    },
  });

  return updated;
}

/**
 * Archive a classroom (teacher only).
 */
export async function archiveClassroom(authCtx: AuthContext, classroomId: string) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can archive this classroom");
  }

  const archived = await db.classroom.update({
    where: { id: classroomId },
    data: { status: "archived" },
  });

  return {
    success: true,
    message: "Classroom archived successfully",
    classroom: archived,
  };
}

/**
 * Regenerate join code for a classroom (teacher only).
 */
export async function regenerateJoinCode(authCtx: AuthContext, classroomId: string) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can regenerate the join code");
  }

  let newCode = generateRandomJoinCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.classroom.findUnique({
      where: { joinCode: newCode },
    });
    if (!existing) break;
    newCode = generateRandomJoinCode();
    attempts++;
  }

  const updated = await db.classroom.update({
    where: { id: classroomId },
    data: { joinCode: newCode },
  });

  return {
    success: true,
    joinCode: updated.joinCode,
  };
}

/**
 * Join a classroom using a join code (student/user).
 * Idempotent: repeated joins succeed without creating duplicate rows.
 */
export async function joinClassroom(authCtx: AuthContext, rawJoinCode: string) {
  const userId = extractUserId(authCtx);

  const normalizedCode = rawJoinCode.trim().toUpperCase();
  if (!normalizedCode) throw badRequest("Join code cannot be empty");

  const classroom = await db.classroom.findFirst({
    where: {
      joinCode: normalizedCode,
    },
    include: {
      teacher: {
        select: { id: true, name: true, username: true, email: true, avatarUrl: true },
      },
    },
  });

  if (!classroom) {
    throw notFound("Invalid classroom join code");
  }

  if (classroom.status === "archived") {
    throw badRequest("This classroom is archived and no longer accepts new students");
  }

  if (classroom.teacherId === userId) {
    return {
      success: true,
      message: "You are the teacher of this classroom",
      classroom,
      isTeacher: true,
    };
  }

  // Check existing membership
  const existingMembership = await db.classroomStudent.findUnique({
    where: {
      classroomId_studentId: {
        classroomId: classroom.id,
        studentId: userId,
      },
    },
  });

  if (existingMembership) {
    if (existingMembership.status === "active") {
      return {
        success: true,
        message: "You are already enrolled in this classroom",
        classroom,
        alreadyEnrolled: true,
      };
    }

    // Reactivate removed student
    await db.classroomStudent.update({
      where: { id: existingMembership.id },
      data: { status: "active", joinedAt: new Date() },
    });

    return {
      success: true,
      message: "Re-enrolled in classroom successfully",
      classroom,
      alreadyEnrolled: false,
    };
  }

  // Create fresh membership
  await db.classroomStudent.create({
    data: {
      classroomId: classroom.id,
      studentId: userId,
      status: "active",
    },
  });

  return {
    success: true,
    message: "Joined classroom successfully",
    classroom,
    alreadyEnrolled: false,
  };
}

/**
 * Leave a classroom (student only).
 */
export async function leaveClassroom(authCtx: AuthContext, classroomId: string) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId === userId) {
    throw badRequest("Teachers cannot leave their own classroom. You can archive it instead.");
  }

  const membership = await db.classroomStudent.findUnique({
    where: {
      classroomId_studentId: {
        classroomId,
        studentId: userId,
      },
    },
  });

  if (!membership || membership.status !== "active") {
    throw notFound("You are not currently enrolled in this classroom");
  }

  await db.classroomStudent.update({
    where: { id: membership.id },
    data: { status: "removed" },
  });

  return {
    success: true,
    message: "Left classroom successfully",
  };
}

/**
 * Invite / add student to classroom by teacher.
 */
export async function inviteStudent(
  authCtx: AuthContext,
  classroomId: string,
  body: InviteStudentBody,
) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can add students");
  }

  if (classroom.status === "archived") {
    throw badRequest("Cannot add students to an archived classroom");
  }

  // Find the student User
  let studentUser = null;
  if (body.studentId) {
    studentUser = await db.user.findUnique({ where: { id: body.studentId } });
  } else if (body.email) {
    studentUser = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  } else if (body.username) {
    studentUser = await db.user.findUnique({ where: { username: body.username.trim() } });
  }

  if (!studentUser) {
    throw notFound("Student user not found");
  }

  if (studentUser.id === classroom.teacherId) {
    throw badRequest("Teacher cannot be added as a student to their own classroom");
  }

  const existing = await db.classroomStudent.findUnique({
    where: {
      classroomId_studentId: {
        classroomId,
        studentId: studentUser.id,
      },
    },
  });

  if (existing) {
    if (existing.status === "active") {
      return {
        success: true,
        message: "Student is already in this classroom",
        student: studentUser,
      };
    }
    const reactivated = await db.classroomStudent.update({
      where: { id: existing.id },
      data: { status: "active", joinedAt: new Date() },
      include: {
        student: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true },
        },
      },
    });
    return {
      success: true,
      message: "Student re-enrolled successfully",
      student: reactivated.student,
    };
  }

  const newMember = await db.classroomStudent.create({
    data: {
      classroomId,
      studentId: studentUser.id,
      status: "active",
    },
    include: {
      student: {
        select: { id: true, name: true, username: true, email: true, avatarUrl: true },
      },
    },
  });

  return {
    success: true,
    message: "Student added successfully",
    student: newMember.student,
  };
}

/**
 * Remove a student from classroom (teacher only).
 */
export async function removeStudent(
  authCtx: AuthContext,
  classroomId: string,
  studentIdOrBody: string | RemoveStudentBody,
) {
  const userId = extractUserId(authCtx);
  const targetStudentId = typeof studentIdOrBody === "string" ? studentIdOrBody : studentIdOrBody.studentId;

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can remove students");
  }

  const membership = await db.classroomStudent.findUnique({
    where: {
      classroomId_studentId: {
        classroomId,
        studentId: targetStudentId,
      },
    },
  });

  if (!membership || membership.status !== "active") {
    throw notFound("Student is not an active member of this classroom");
  }

  await db.classroomStudent.update({
    where: { id: membership.id },
    data: { status: "removed" },
  });

  return {
    success: true,
    message: "Student removed from classroom",
  };
}

/**
 * Get classroom analytics summary (teacher only).
 */
export async function getClassroomAnalytics(authCtx: AuthContext, classroomId: string) {
  const userId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    include: {
      students: {
        where: { status: "active" },
        include: {
          student: {
            select: { id: true, name: true, username: true, email: true, avatarUrl: true },
          },
        },
      },
      assignments: {
        where: { status: { not: "archived" } },
      },
    },
  });

  if (!classroom) throw notFound("Classroom not found");

  if (classroom.teacherId !== userId && !isUserAdmin(authCtx)) {
    throw forbidden("Only the classroom teacher can view classroom analytics");
  }

  const assignmentIds = classroom.assignments.map((a) => a.id);
  const totalStudents = classroom.students.length;
  const totalAssignments = classroom.assignments.length;

  if (assignmentIds.length === 0 || totalStudents === 0) {
    return {
      totalStudents,
      activeStudents: totalStudents,
      totalAssignments,
      completedSubmissions: 0,
      averageScore: 0,
      passRate: 0,
      completionRate: 0,
      recentActivity: [],
    };
  }

  const attempts = await db.assessmentAttempt.findMany({
    where: {
      assessmentId: { in: classroom.assignments.map((a) => a.assessmentId).filter(Boolean) as string[] },
      status: { in: ["graded", "submitted"] },
    },
    include: {
      student: {
        select: { id: true, name: true, username: true, email: true, avatarUrl: true },
      },
      assessment: {
        select: { id: true, title: true },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 20,
  });

  const safeAttempts = attempts || [];
  const scores = safeAttempts.map((a) => a.score ?? 0);
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100
    : 0;

  const passedCount = safeAttempts.filter((a) => a.passed === true).length;
  const passRate = safeAttempts.length > 0
    ? Math.round((passedCount / safeAttempts.length) * 100)
    : 0;

  const expectedSubmissions = totalStudents * totalAssignments;
  const completionRate = expectedSubmissions > 0
    ? Math.min(100, Math.round((safeAttempts.length / expectedSubmissions) * 100))
    : 0;

  const recentActivity = safeAttempts.map((att) => ({
    attemptId: att.id,
    assignmentId: classroom.assignments.find((a) => a.assessmentId === att.assessmentId)?.id,
    assessmentTitle: att.assessment?.title,
    student: att.student,
    score: att.score,
    passed: att.passed,
    submittedAt: att.submittedAt,
  }));

  return {
    totalStudents,
    activeStudents: totalStudents,
    totalAssignments,
    completedSubmissions: attempts.length,
    averageScore,
    passRate,
    completionRate,
    recentActivity,
  };
}

/**
 * Get individual student progress within a classroom.
 */
export async function getStudentClassroomProgress(
  authCtx: AuthContext,
  classroomId: string,
  targetStudentId?: string,
) {
  const currentUserId = extractUserId(authCtx);

  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    include: {
      assignments: {
        where: { status: { not: "archived" } },
        include: {
          assessment: {
            select: { id: true, title: true, passingScore: true, duration: true },
          },
        },
      },
    },
  });

  if (!classroom) throw notFound("Classroom not found");

  const isTeacher = classroom.teacherId === currentUserId || isUserAdmin(authCtx);
  const studentId = targetStudentId || currentUserId;

  if (!isTeacher && studentId !== currentUserId) {
    throw forbidden("Cannot view another student's progress");
  }

  const assignmentIds = classroom.assignments.map((a) => a.id);

  const studentAttempts = await db.assessmentAttempt.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      studentId,
    },
    orderBy: { submittedAt: "desc" },
  });

  const completedAttempts = studentAttempts.filter(
    (a) => a.status === "graded" || a.status === "submitted",
  );

  const completedAssignmentIds = new Set(completedAttempts.map((a) => a.assignmentId));
  const completedCount = completedAssignmentIds.size;
  const pendingCount = Math.max(0, classroom.assignments.length - completedCount);

  const scores = completedAttempts.map((a) => a.score ?? 0);
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100
    : 0;

  const passedCount = completedAttempts.filter((a) => a.passed === true).length;
  const passRate = completedAttempts.length > 0
    ? Math.round((passedCount / completedAttempts.length) * 100)
    : 0;

  const completionRate = classroom.assignments.length > 0
    ? Math.round((completedCount / classroom.assignments.length) * 100)
    : 0;

  return {
    studentId,
    classroomId,
    totalAssignments: classroom.assignments.length,
    completedCount,
    pendingCount,
    averageScore,
    passRate,
    completionRate,
    attempts: studentAttempts.map((att) => ({
      id: att.id,
      assignmentId: att.assignmentId,
      status: att.status,
      attemptNumber: att.attemptNumber,
      score: att.score,
      passed: att.passed,
      startedAt: att.startedAt,
      submittedAt: att.submittedAt,
    })),
  };
}
