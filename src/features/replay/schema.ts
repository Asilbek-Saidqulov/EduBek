/**
 * EduBek — Live Quiz Replay Zod schemas.
 */
import { z } from "zod";

export const updateReplayBodySchema = z.object({
  visibility: z.enum(["session_participants", "classroom", "org", "public"]).optional(),
});
export type UpdateReplayBody = z.infer<typeof updateReplayBodySchema>;

export const listReplaysQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  visibility: z.enum(["session_participants", "classroom", "org", "public"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReplaysQuery = z.infer<typeof listReplaysQuerySchema>;
