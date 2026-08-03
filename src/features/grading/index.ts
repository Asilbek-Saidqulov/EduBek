/**
 * EduBek — Grading feature barrel export.
 *
 * Note: the Grade row is stored in the submission repository (Grade is a 1:1
 * child of Submission). The grading feature contributes only the service
 * layer that orchestrates grading, returning, and publishing.
 */
export {
  gradeSubmission,
  returnSubmission,
  publishGrade,
} from "./service";

export type { GradeDto } from "./types";
