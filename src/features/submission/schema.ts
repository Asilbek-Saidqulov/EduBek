/**
 * EduBek — Submission feature Zod schemas.
 */
import { z } from "zod";

export const submitBodySchema = z.object({
  attemptId: z.string().min(1),
  content: z.string().max(200_000).optional(),
});
export type SubmitBody = z.infer<typeof submitBodySchema>;

export const saveDraftBodySchema = z.object({
  attemptId: z.string().min(1),
  content: z.string().max(200_000).optional(),
});
export type SaveDraftBody = z.infer<typeof saveDraftBodySchema>;

export const resubmitBodySchema = z.object({
  content: z.string().max(200_000).optional(),
});
export type ResubmitBody = z.infer<typeof resubmitBodySchema>;

export const listSubmissionsQuerySchema = z.object({
  classroomId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  status: z
    .enum(["draft", "submitted", "returned", "resubmitted", "graded"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
