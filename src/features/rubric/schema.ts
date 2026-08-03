/**
 * EduBek — Rubric Zod schemas.
 */
import { z } from "zod";

export const rubricLevelSchema = z.object({
  points: z.number().min(0).max(100),
  label: z.string().min(1).max(120),
  description: z.string().max(2_000).optional(),
});

export const rubricCriterionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional(),
  maxPoints: z.number().int().min(1).max(100).default(10),
  levels: z.array(rubricLevelSchema).min(2).max(10),
  order: z.number().int().min(0).default(0),
});

export const createRubricBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional(),
  maxPoints: z.number().int().min(1).max(1_000).default(100),
  orgId: z.string().min(1).optional(),
  criteria: z.array(rubricCriterionSchema).min(1).max(20),
});
export type CreateRubricBody = z.infer<typeof createRubricBodySchema>;

export const updateRubricBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2_000).nullable().optional(),
  maxPoints: z.number().int().min(1).max(1_000).optional(),
  criteria: z.array(rubricCriterionSchema).optional(),
});
export type UpdateRubricBody = z.infer<typeof updateRubricBodySchema>;

export const assignRubricBodySchema = z.object({
  assessmentId: z.string().min(1),
});
export type AssignRubricBody = z.infer<typeof assignRubricBodySchema>;
