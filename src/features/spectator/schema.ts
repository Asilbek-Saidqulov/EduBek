/**
 * EduBek — Live Quiz Spectator Zod schemas.
 */
import { z } from "zod";

export const createSpectatorTokenBodySchema = z.object({
  sessionId: z.string().min(1),
  expiresIn: z.number().int().min(60).max(86_400).default(3_600),
});
export type CreateSpectatorTokenBody = z.infer<typeof createSpectatorTokenBodySchema>;

export const listSpectatorsQuerySchema = z.object({
  sessionId: z.string().min(1),
});
export type ListSpectatorsQuery = z.infer<typeof listSpectatorsQuerySchema>;
