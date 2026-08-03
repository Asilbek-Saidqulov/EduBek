/**
 * EduBek — Live Quiz Lobby Zod schemas.
 */
import { z } from "zod";

export const updateLobbyBodySchema = z.object({
  visibility: z.enum(["private", "classroom", "org", "public"]).optional(),
  maxPlayers: z.number().int().min(2).max(1_000).optional(),
  locked: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  // Phase 4C.1 additive
  minPlayers: z.number().int().min(1).max(1_000).optional(),
  maxSpectators: z.number().int().min(0).max(10_000).optional(),
  lateJoinPolicy: z.enum(["allow", "deny", "allow_during_round"]).optional(),
  requireReadyCheck: z.boolean().optional(),
});
export type UpdateLobbyBody = z.infer<typeof updateLobbyBodySchema>;

export const approveWaitingRoomBodySchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
  approve: z.boolean().default(true),
});
export type ApproveWaitingRoomBody = z.infer<typeof approveWaitingRoomBodySchema>;

export const listLobbiesQuerySchema = z.object({
  visibility: z.enum(["private", "classroom", "org", "public"]).optional(),
  status: z.enum(["open", "countdown", "closed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLobbiesQuery = z.infer<typeof listLobbiesQuerySchema>;
