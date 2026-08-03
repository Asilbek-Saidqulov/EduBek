/**
 * EduBek — Classroom feature Zod schemas.
 *
 * These validate the request bodies of the classroom API routes. Service-layer
 * business rules (teacher exists, student exists, org membership, …) are
 * enforced separately — Zod only checks shape.
 */
import { z } from "zod";

export const createClassroomBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2_000).optional(),
  orgId: z.string().min(1).optional(),
});
export type CreateClassroomBody = z.infer<typeof createClassroomBodySchema>;

export const updateClassroomBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2_000).nullable().optional(),
});
export type UpdateClassroomBody = z.infer<typeof updateClassroomBodySchema>;

/**
 * Invite a student to a classroom. The caller may supply either a known
 * `studentId` or an `email` — the service resolves the email to a userId.
 */
export const inviteStudentBodySchema = z
  .object({
    studentId: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((v) => Boolean(v.studentId || v.email), {
    message: "Either studentId or email is required",
  });
export type InviteStudentBody = z.infer<typeof inviteStudentBodySchema>;
