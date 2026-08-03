/**
 * EduBek — Assignment feature Zod schemas.
 */
import { z } from "zod";

export const createAssignmentBodySchema = z.object({
  classroomId: z.string().min(1),
  resourceId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  instructions: z.string().max(10_000).optional(),
  dueDate: z.coerce.date().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  allowLate: z.boolean().default(true),
  points: z.number().int().min(1).max(10_000).default(100),
});
export type CreateAssignmentBody = z.infer<typeof createAssignmentBodySchema>;

export const updateAssignmentBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  instructions: z.string().max(10_000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  allowLate: z.boolean().optional(),
  points: z.number().int().min(1).max(10_000).optional(),
});
export type UpdateAssignmentBody = z.infer<typeof updateAssignmentBodySchema>;

export const duplicateAssignmentBodySchema = z.object({
  targetClassroomId: z.string().min(1),
});
export type DuplicateAssignmentBody = z.infer<
  typeof duplicateAssignmentBodySchema
>;
