/**
 * EduBek — Submission feature domain types (DTOs).
 */
export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "returned"
  | "resubmitted"
  | "graded";

export interface SubmissionDto {
  id: string;
  attemptId: string;
  studentId: string;
  content: string | null;
  feedback: string | null;
  status: SubmissionStatus;
  attachments: unknown | null;
  submittedAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Populated when the submission has been graded. */
  grade?: {
    id: string;
    points: number;
    maxPoints: number;
    feedback: string | null;
    publishedAt: string | null;
    teacherId: string;
  } | null;
}

export interface SubmissionListQuery {
  classroomId?: string;
  assignmentId?: string;
  studentId?: string;
  status?: SubmissionStatus;
  limit?: number;
  offset?: number;
}
