/**
 * EduBek — Live Quiz Participant Zod schemas.
 */
import { z } from "zod";

export const updatePlayerBodySchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  status: z.enum(["active", "eliminated", "disconnected", "left"]).optional(),
});
export type UpdatePlayerBody = z.infer<typeof updatePlayerBodySchema>;

export const listPlayersQuerySchema = z.object({
  sessionId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  status: z.enum(["active", "eliminated", "disconnected", "left"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;
