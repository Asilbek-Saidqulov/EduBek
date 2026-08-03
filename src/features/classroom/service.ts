/**
 * EduBek — Classroom service.
 *
 * Business logic for creating and managing classrooms. Routes are thin
 * wrappers; everything throw-able lives here.
 *
 * Authorization model:
 *   • createClassroom       — PersonalPermission.CLASSROOM_MANAGE. If the
 *                             classroom is created inside an org, the caller
 *                             must additionally be a member of that org.
 *   • update/archive/invite — teacher of the classroom only (or superadmin).
 *   • getClassroom          — teacher or any active student in the classroom.
 *
 * Events published:
 *   • CLASSROOM_CREATED     — when a classroom is created
 *   • CLASSROOM_ARCHIVED    — when a classroom is archived
 *   • STUDENT_JOINED_CLASS  — when a student is invited to a classroom
 *   • STUDENT_REMOVED       — when a student is removed from a classroom
 */
import { getLogger } from "@/lib/logger";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  canInOrg,
  isOrgMember,
  PersonalPermission,
  OrgPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  CLASSROOM_ARCHIVED,
  CLASSROOM_CREATED,
  STUDENT_JOINED_CLASS,
  STUDENT_REMOVED,
  type ClassroomArchivedEvent,
  type ClassroomCreatedEvent,
  type StudentJoinedClassEvent,
  type StudentRemovedEvent,
} from "@/infra/event-bus/events";
import { findUserByEmail } from "@/features/auth/auth.repository";
import * as repo from "./repository";
import type {
  ClassroomDto,
  ClassroomStudentDto,
  ClassroomWithStudentsDto,
} from "./types";
import type {
  CreateClassroomBody,
  InviteStudentBody,
  UpdateClassroomBody,
} from "./schema";

const log = getLogger("classroom-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapClassroom(c: any): ClassroomDto {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    teacherId: c.teacherId,
    orgId: c.orgId,
    status: c.status,
    studentCount:
      c._count?.students ??
      c.students?.length ??
      0,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapStudent(s: any): ClassroomStudentDto {
  return {
    id: s.id,
    classroomId: s.classroomId,
    studentId: s.studentId,
    studentName: s.student?.name ?? null,
    studentEmail: s.student?.email ?? "",
    joinedAt: s.joinedAt.toISOString(),
    status: s.status,
  };
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

function isTeacherOf(ctx: AuthContext, classroom: { teacherId: string }): boolean {
  return ctx.isSuperadmin || classroom.teacherId === ctx.userId;
}

// ---------------------------------------------------------------------------
// createClassroom
// ---------------------------------------------------------------------------

export async function createClassroom(
  ctx: AuthContext,
  input: CreateClassroomBody,
): Promise<ClassroomDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.CLASSROOM_MANAGE)) {
    throw forbidden("No permission to manage classrooms");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (
      !ctx.isSuperadmin &&
      !canInOrg(ctx, input.orgId, OrgPermission.ORG_CLASSROOM_MANAGE)
    ) {
      throw forbidden("No org permission to manage classrooms");
    }
  }

  const created = await repo.createClassroom({
    name: input.name,
    description: input.description,
    teacherId: ctx.userId,
    orgId: input.orgId,
  });

  eventBus.publish(
    buildEvent<ClassroomCreatedEvent>({
      type: CLASSROOM_CREATED,
      actorId: ctx.userId,
      classroomId: created.id,
      name: created.name,
      teacherId: created.teacherId,
      orgId: created.orgId,
    }),
  );

  log.info("classroom.created", {
    classroomId: created.id,
    teacherId: ctx.userId,
    orgId: created.orgId,
  });

  return mapClassroom({ ...created, _count: { students: 0 } });
}

// ---------------------------------------------------------------------------
// getClassroom
// ---------------------------------------------------------------------------

export async function getClassroom(
  ctx: AuthContext,
  id: string,
): Promise<ClassroomWithStudentsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const classroom = await repo.findClassroomWithStudents(id);
  if (!classroom) throw notFound("Classroom not found");

  const isTeacher = isTeacherOf(ctx, classroom);
  const isStudent =
    classroom.students.some((s: any) => s.studentId === ctx.userId) ||
    (await repo.findStudent(id, ctx.userId))?.status === "active";
  const inOrg = classroom.orgId
    ? isOrgMember(ctx, classroom.orgId) || ctx.isSuperadmin
    : false;

  if (!isTeacher && !isStudent && !inOrg) {
    throw forbidden("You do not have access to this classroom");
  }

  return {
    ...mapClassroom(classroom),
    students: classroom.students.map(mapStudent),
  };
}

// ---------------------------------------------------------------------------
// listMyClassrooms
// ---------------------------------------------------------------------------

export async function listMyClassrooms(
  ctx: AuthContext,
): Promise<ClassroomDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const [taught, enrolled] = await Promise.all([
    repo.findClassroomsByTeacher(ctx.userId),
    repo.findClassroomsByStudent(ctx.userId),
  ]);
  // De-duplicate: a user could theoretically be both teacher of one
  // classroom and student in another, but never both for the same classroom.
  const seen = new Set<string>();
  const out: ClassroomDto[] = [];
  for (const c of taught) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(mapClassroom(c));
  }
  for (const c of enrolled) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(mapClassroom(c));
  }
  return out;
}

// ---------------------------------------------------------------------------
// updateClassroom
// ---------------------------------------------------------------------------

export async function updateClassroom(
  ctx: AuthContext,
  id: string,
  input: UpdateClassroomBody,
): Promise<ClassroomDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findClassroomById(id);
  if (!existing) throw notFound("Classroom not found");
  if (!isTeacherOf(ctx, existing)) {
    throw forbidden("Only the teacher can update this classroom");
  }

  const updated = await repo.updateClassroom(id, {
    name: input.name,
    description: input.description,
  });

  return mapClassroom({ ...updated, _count: { students: 0 } });
}

// ---------------------------------------------------------------------------
// archiveClassroom
// ---------------------------------------------------------------------------

export async function archiveClassroom(
  ctx: AuthContext,
  id: string,
): Promise<ClassroomDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findClassroomById(id);
  if (!existing) throw notFound("Classroom not found");
  if (!isTeacherOf(ctx, existing)) {
    throw forbidden("Only the teacher can archive this classroom");
  }

  const archived = await repo.archiveClassroom(id);

  eventBus.publish(
    buildEvent<ClassroomArchivedEvent>({
      type: CLASSROOM_ARCHIVED,
      actorId: ctx.userId,
      classroomId: archived.id,
    }),
  );

  return mapClassroom({ ...archived, _count: { students: 0 } });
}

// ---------------------------------------------------------------------------
// inviteStudent
// ---------------------------------------------------------------------------

export async function inviteStudent(
  ctx: AuthContext,
  classroomId: string,
  input: InviteStudentBody,
): Promise<ClassroomStudentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const classroom = await repo.findClassroomById(classroomId);
  if (!classroom) throw notFound("Classroom not found");
  if (!isTeacherOf(ctx, classroom)) {
    throw forbidden("Only the teacher can invite students");
  }

  // Resolve email → studentId if needed.
  let studentId = input.studentId;
  if (!studentId && input.email) {
    const user = await findUserByEmail(input.email);
    if (!user) {
      throw notFound("No user found with that email");
    }
    studentId = user.id;
  }
  if (!studentId) {
    throw notFound("studentId or email is required");
  }

  // Don't allow the teacher to invite themselves into their own classroom.
  if (studentId === classroom.teacherId) {
    throw forbidden("Teacher cannot be added as a student");
  }

  const membership = await repo.addStudent(classroomId, studentId);

  eventBus.publish(
    buildEvent<StudentJoinedClassEvent>({
      type: STUDENT_JOINED_CLASS,
      actorId: ctx.userId,
      classroomId,
      studentId,
    }),
  );

  log.info("classroom.student_invited", { classroomId, studentId });

  // Re-fetch with the student relation populated for the DTO.
  const populated = await repo.findStudent(classroomId, studentId);
  return mapStudent(
    populated ?? {
      ...membership,
      student: null,
    },
  );
}

// ---------------------------------------------------------------------------
// removeStudent
// ---------------------------------------------------------------------------

export async function removeStudent(
  ctx: AuthContext,
  classroomId: string,
  studentId: string,
): Promise<void> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const classroom = await repo.findClassroomById(classroomId);
  if (!classroom) throw notFound("Classroom not found");
  if (!isTeacherOf(ctx, classroom)) {
    throw forbidden("Only the teacher can remove students");
  }

  const existing = await repo.findStudent(classroomId, studentId);
  if (!existing) throw notFound("Student is not in this classroom");

  await repo.removeStudent(classroomId, studentId);

  eventBus.publish(
    buildEvent<StudentRemovedEvent>({
      type: STUDENT_REMOVED,
      actorId: ctx.userId,
      classroomId,
      studentId,
    }),
  );

  log.info("classroom.student_removed", { classroomId, studentId });
}

// ---------------------------------------------------------------------------
// listStudents
// ---------------------------------------------------------------------------

export async function listStudents(
  ctx: AuthContext,
  classroomId: string,
): Promise<ClassroomStudentDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const classroom = await repo.findClassroomById(classroomId);
  if (!classroom) throw notFound("Classroom not found");

  const isTeacher = isTeacherOf(ctx, classroom);
  const myMembership = await repo.findStudent(classroomId, ctx.userId);
  const isStudent = myMembership?.status === "active";
  const inOrg = classroom.orgId
    ? isOrgMember(ctx, classroom.orgId) || ctx.isSuperadmin
    : false;

  if (!isTeacher && !isStudent && !inOrg) {
    throw forbidden("You do not have access to this classroom");
  }

  const students = await repo.findStudents(classroomId);
  return students.map(mapStudent);
}
