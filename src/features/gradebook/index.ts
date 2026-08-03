/**
 * EduBek — Gradebook feature barrel export.
 */
export {
  recordGrade,
  getStudentGrades,
  getClassroomGrades,
  exportGradebook,
  type RecordGradeInput,
} from "./service";

export type {
  GradebookSourceType,
  GradebookEntryDto,
  StudentGradebookDto,
  ClassroomGradebookDto,
} from "./types";
