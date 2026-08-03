/**
 * EduBek — Progress feature barrel export.
 */
export {
  getStudentProgress,
  getClassroomProgress,
  updateProgress,
  getLearningStreak,
} from "./service";

export type {
  ProgressRecordDto,
  StudentProgressDto,
  ClassroomProgressDto,
  ClassroomStudentProgressEntry,
  ProgressMetric,
} from "./types";
