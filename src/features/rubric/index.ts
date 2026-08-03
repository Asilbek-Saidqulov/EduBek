/**
 * EduBek — Rubric feature barrel export.
 */
export {
  createRubric,
  getRubric,
  listMyRubrics,
  updateRubric,
  archiveRubric,
  duplicateRubric,
  assignRubricToAssessment,
} from "./service";

export {
  createRubricBodySchema,
  updateRubricBodySchema,
  assignRubricBodySchema,
  rubricCriterionSchema,
  rubricLevelSchema,
  type CreateRubricBody,
  type UpdateRubricBody,
  type AssignRubricBody,
} from "./schema";

export type {
  RubricDto,
  RubricCriterionDto,
  RubricLevel,
  RubricStatus,
} from "./types";
