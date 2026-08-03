/**
 * EduBek — Certificate Zod schemas.
 */
import { z } from "zod";

export const issueCertificateBodySchema = z.object({
  studentId: z.string().min(1),
  classroomId: z.string().min(1).optional(),
  assessmentId: z.string().min(1).optional(),
  resourceId: z.string().min(1).optional(),
  certificateType: z.enum(["assessment", "course", "achievement"]).default("assessment"),
  title: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  courseName: z.string().max(200).optional(),
  score: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
});
export type IssueCertificateBody = z.infer<typeof issueCertificateBodySchema>;

export const revokeCertificateBodySchema = z.object({
  reason: z.string().min(1).max(2_000),
});
export type RevokeCertificateBody = z.infer<typeof revokeCertificateBodySchema>;

export const listCertificatesQuerySchema = z.object({
  studentId: z.string().min(1).optional(),
  classroomId: z.string().min(1).optional(),
  assessmentId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCertificatesQuery = z.infer<typeof listCertificatesQuerySchema>;
