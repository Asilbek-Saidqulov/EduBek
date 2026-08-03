/**
 * EduBek — Learning-session feature Zod schemas.
 */
import { z } from "zod";

export const startSessionBodySchema = z
  .object({
    resourceId: z.string().min(1).optional(),
    attemptId: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.resourceId || v.attemptId), {
    message: "Either resourceId or attemptId is required",
  });
export type StartSessionBody = z.infer<typeof startSessionBodySchema>;
