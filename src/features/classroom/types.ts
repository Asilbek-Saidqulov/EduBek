/**
 * EduBek — Classroom feature domain types (DTOs).
 *
 * DTOs are the wire format returned by services and routes. They are plain
 * objects with ISO date strings (never `Date` instances) so they can be
 * serialized to JSON without further transformation.
 */

export type ClassroomStatus = "active" | "archived";
export type ClassroomStudentStatus = "active" | "removed";

export interface ClassroomDto {
  id: string;
  name: string;
  description: string | null;
  teacherId: string;
  orgId: string | null;
  status: ClassroomStatus;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomStudentDto {
  id: string;
  classroomId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  joinedAt: string;
  status: ClassroomStudentStatus;
}

export interface ClassroomWithStudentsDto extends ClassroomDto {
  students: ClassroomStudentDto[];
}
