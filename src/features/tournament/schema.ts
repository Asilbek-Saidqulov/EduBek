/**
 * EduBek — Live Quiz Tournament Zod schemas.
 */
import { z } from "zod";

export const createTournamentBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  gameMode: z.enum(["classic", "treasure", "empire", "royale", "battle"]).default("battle"),
  format: z.enum(["single_elimination", "double_elimination", "round_robin"]).default("single_elimination"),
  bracketSize: z.number().int().min(2).max(128).refine(
    (n) => (n & (n - 1)) === 0,
    "bracketSize must be a power of 2 for single elimination",
  ).default(8),
  classroomId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  participantIds: z.array(z.string().min(1)).max(128).optional(),
  // Phase 4C.1 additive
  scheduledStartAt: z.string().datetime().optional(),
  checkInWindowMinutes: z.number().int().min(0).max(1440).default(15),
  lateRegistrationClosesAt: z.string().datetime().optional(),
  autoAdvancement: z.boolean().default(true),
});
export type CreateTournamentBody = z.infer<typeof createTournamentBodySchema>;

export const checkInBodySchema = z.object({
  userId: z.string().min(1).optional(),
});
export type CheckInBody = z.infer<typeof checkInBodySchema>;

export const registerBodySchema = z.object({
  userId: z.string().min(1).optional(),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const listTournamentsQuerySchema = z.object({
  status: z.enum(["draft", "registration", "in_progress", "finished", "cancelled"]).optional(),
  hostId: z.string().min(1).optional(),
  classroomId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTournamentsQuery = z.infer<typeof listTournamentsQuerySchema>;
