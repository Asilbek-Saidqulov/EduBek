/**
 * EduBek — Live Quiz Matchmaking Zod schemas.
 */
import { z } from "zod";

export const matchmakingBodySchema = z.object({
  strategy: z.enum([
    "random", "tournament", "classroom", "org", "invitation", "private", "public",
  ]),
  gameMode: z.enum(["classic", "treasure", "empire", "royale", "battle"]).optional(),
  classroomId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  tournamentId: z.string().min(1).optional(),
  inviteToken: z.string().min(1).optional(),
  maxWaitMs: z.number().int().min(0).max(60_000).default(5_000),
});
export type MatchmakingBody = z.infer<typeof matchmakingBodySchema>;
