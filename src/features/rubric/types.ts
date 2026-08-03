/**
 * EduBek — Rubric feature domain types (DTOs).
 *
 * A rubric is a reusable grading template with N criteria, each carrying
 * its own maximum points and a list of performance levels. Rubrics are
 * attached to assessments (and to assignments in Phase 4A) and drive the
 * manual grading UI.
 */

export type RubricStatus = "active" | "archived";

export interface RubricLevel {
  points: number;
  label: string;
  description?: string;
}

export interface RubricCriterionDto {
  id: string;
  rubricId: string;
  name: string;
  description: string | null;
  maxPoints: number;
  levels: RubricLevel[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RubricDto {
  id: string;
  ownerId: string;
  orgId: string | null;
  name: string;
  description: string | null;
  maxPoints: number;
  status: RubricStatus;
  criteria: RubricCriterionDto[];
  createdAt: string;
  updatedAt: string;
}
