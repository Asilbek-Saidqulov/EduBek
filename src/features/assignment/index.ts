/**
 * EduBek — Assignment feature barrel export.
 */
export {
  createAssignment,
  getAssignment,
  listAssignmentsByClassroom,
  updateAssignment,
  publishAssignment,
  archiveAssignment,
  duplicateAssignment,
  startAssignment,
  getMyAttempts,
} from "./service";

export {
  createAssignmentBodySchema,
  updateAssignmentBodySchema,
  duplicateAssignmentBodySchema,
  type CreateAssignmentBody,
  type UpdateAssignmentBody,
  type DuplicateAssignmentBody,
} from "./schema";

export type {
  AssignmentDto,
  AssignmentAttemptDto,
  AssignmentWithAttemptsDto,
  AssignmentVisibility,
  AttemptStatus,
} from "./types";
