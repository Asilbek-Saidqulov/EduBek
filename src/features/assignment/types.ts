/**
 * EduBek — Assignment feature domain types (DTOs).
 */
export type AssignmentVisibility = "draft" | "published" | "archived";
export type AttemptStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "graded"
  | "returned";

export interface AssignmentDto {
  id: string;
  classroomId: string;
  resourceId: string;
  teacherId: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  visibility: AssignmentVisibility;
  maxAttempts: number;
  allowLate: boolean;
  points: number;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentAttemptDto {
  id: string;
  assignmentId: string;
  studentId: string;
  resourceCopyId: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  score: number | null;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentWithAttemptsDto extends AssignmentDto {
  /** Only populated for teachers viewing their own assignment. */
  attempts?: AssignmentAttemptDto[];
}
