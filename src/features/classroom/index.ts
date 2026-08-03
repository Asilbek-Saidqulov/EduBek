/**
 * EduBek — Classroom feature barrel export.
 */
export {
  createClassroom,
  getClassroom,
  listMyClassrooms,
  updateClassroom,
  archiveClassroom,
  inviteStudent,
  removeStudent,
  listStudents,
} from "./service";

export {
  createClassroomBodySchema,
  updateClassroomBodySchema,
  inviteStudentBodySchema,
  type CreateClassroomBody,
  type UpdateClassroomBody,
  type InviteStudentBody,
} from "./schema";

export type {
  ClassroomDto,
  ClassroomStudentDto,
  ClassroomWithStudentsDto,
  ClassroomStatus,
  ClassroomStudentStatus,
} from "./types";
