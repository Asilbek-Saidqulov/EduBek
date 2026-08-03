/**
 * EduBek — Grading feature domain types (DTOs).
 */
export interface GradeDto {
  id: string;
  submissionId: string;
  teacherId: string;
  points: number;
  maxPoints: number;
  rubric: unknown | null;
  feedback: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
