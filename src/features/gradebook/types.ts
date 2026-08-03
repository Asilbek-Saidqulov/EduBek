/**
 * EduBek — Gradebook feature domain types (DTOs).
 *
 * GradebookEntry is a denormalized read model. Services (assessment, exam,
 * grading) write to it whenever a graded attempt is finalized. Read-side
 * services (this module) only query and aggregate.
 */
export type GradebookSourceType = "assignment" | "assessment" | "exam";

export interface GradebookEntryDto {
  id: string;
  classroomId: string | null;
  studentId: string;
  sourceType: GradebookSourceType;
  sourceId: string;
  attemptId: string | null;
  title: string;
  points: number | null;
  maxPoints: number;
  percentage: number | null;
  passed: boolean | null;
  gradedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentGradebookDto {
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  entries: GradebookEntryDto[];
  averagePercentage: number | null;
  passedCount: number;
  totalCount: number;
}

export interface ClassroomGradebookDto {
  classroomId: string;
  classroomName: string;
  studentCount: number;
  students: StudentGradebookDto[];
  classAverage: number | null;
}
