/**
 * EduBek — Live Quiz Zod schemas (Quiz Session request bodies).
 */
import { z } from "zod";

export const gameModeSchema = z.enum([
  "classic", "treasure", "empire", "royale", "battle",
]);

export const createSessionBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  gameMode: gameModeSchema,
  config: z.record(z.string(), z.unknown()).optional(),
  classroomId: z.string().min(1).optional(),
  resourceId: z.string().min(1).optional(),
  assessmentId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  visibility: z.enum(["private", "classroom", "org", "public"]).default("private"),
  maxPlayers: z.number().int().min(2).max(1_000).default(50),
  password: z.string().min(1).max(200).optional(),
  questionIds: z.array(z.string().min(1)).max(200).optional(),
});
export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;

export const joinSessionBodySchema = z.object({
  joinCode: z.string().min(4).max(20),
  password: z.string().max(200).optional(),
  displayName: z.string().min(1).max(120).optional(),
  role: z.enum(["player", "spectator"]).default("player"),
});
export type JoinSessionBody = z.infer<typeof joinSessionBodySchema>;

export const updateSessionBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5_000).nullable().optional(),
  visibility: z.enum(["private", "classroom", "org", "public"]).optional(),
  maxPlayers: z.number().int().min(2).max(1_000).optional(),
  coHostIds: z.array(z.string().min(1)).optional(),
});
export type UpdateSessionBody = z.infer<typeof updateSessionBodySchema>;

export const submitAnswerBodySchema = z.object({
  answer: z.unknown(),
  responseMs: z.number().int().min(0).max(600_000),
});
export type SubmitAnswerBody = z.infer<typeof submitAnswerBodySchema>;

export const startSessionBodySchema = z.object({
  countdownSeconds: z.number().int().min(0).max(60).default(5),
});
export type StartSessionBody = z.infer<typeof startSessionBodySchema>;

export const listSessionsQuerySchema = z.object({
  hostId: z.string().min(1).optional(),
  classroomId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  gameMode: gameModeSchema.optional(),
  status: z.enum(["lobby", "countdown", "in_progress", "paused", "finished", "cancelled"]).optional(),
  visibility: z.enum(["private", "classroom", "org", "public"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
