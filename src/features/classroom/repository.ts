/**
 * EduBek — Classroom repository.
 *
 * The ONLY layer in this feature that imports `db`. Services compose these
 * primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Classrooms
// ---------------------------------------------------------------------------

export interface CreateClassroomInput {
  name: string;
  description?: string;
  teacherId: string;
  orgId?: string;
}

export async function createClassroom(input: CreateClassroomInput) {
  return db.classroom.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      teacherId: input.teacherId,
      orgId: input.orgId ?? null,
      status: "active",
    },
  });
}

export async function findClassroomById(id: string) {
  return db.classroom.findUnique({ where: { id } });
}

export async function findClassroomWithStudents(id: string) {
  return db.classroom.findUnique({
    where: { id },
    include: {
      students: {
        where: { status: "active" },
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
    },
  });
}

export async function findClassroomsByTeacher(teacherId: string) {
  return db.classroom.findMany({
    where: { teacherId, status: "active" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { students: true } } },
  });
}

/**
 * Returns every classroom the student is currently an active member of.
 * Joins through `ClassroomStudent` so we get the membership row alongside.
 */
export async function findClassroomsByStudent(studentId: string) {
  return db.classroom.findMany({
    where: {
      status: "active",
      students: { some: { studentId, status: "active" } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      _count: { select: { students: true } },
    },
  });
}

export async function updateClassroom(
  id: string,
  data: { name?: string; description?: string | null },
) {
  return db.classroom.update({ where: { id }, data });
}

export async function archiveClassroom(id: string) {
  return db.classroom.update({
    where: { id },
    data: { status: "archived" },
  });
}

// ---------------------------------------------------------------------------
// Classroom membership
// ---------------------------------------------------------------------------

export async function addStudent(classroomId: string, studentId: string) {
  // Use upsert so re-inviting a previously-removed student reactivates them
  // rather than throwing on the (classroomId, studentId) unique constraint.
  return db.classroomStudent.upsert({
    where: {
      classroomId_studentId: { classroomId, studentId },
    },
    create: { classroomId, studentId, status: "active" },
    update: { status: "active" },
  });
}

export async function removeStudent(classroomId: string, studentId: string) {
  // Soft-delete: mark as removed so historical submissions remain
  // attributable to the student.
  return db.classroomStudent.update({
    where: { classroomId_studentId: { classroomId, studentId } },
    data: { status: "removed" },
  });
}

export async function findStudent(
  classroomId: string,
  studentId: string,
) {
  return db.classroomStudent.findUnique({
    where: { classroomId_studentId: { classroomId, studentId } },
  });
}

export async function findStudents(classroomId: string) {
  return db.classroomStudent.findMany({
    where: { classroomId, status: "active" },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: "desc" },
  });
}
