/**
 * EduBek — Certificate repository.
 */
import { db } from "@/lib/db";

export interface CreateCertificateInput {
  verificationCode: string;
  certificateNumber: string;
  studentId: string;
  issuedById: string;
  classroomId?: string;
  assessmentId?: string;
  resourceId?: string;
  certificateType: string;
  title: string;
  description?: string;
  studentName: string;
  issuerName: string;
  courseName?: string;
  score?: number;
  maxScore?: number;
}

export async function createCertificate(input: CreateCertificateInput) {
  return db.certificate.create({
    data: {
      verificationCode: input.verificationCode,
      certificateNumber: input.certificateNumber,
      studentId: input.studentId,
      issuedById: input.issuedById,
      classroomId: input.classroomId ?? null,
      assessmentId: input.assessmentId ?? null,
      resourceId: input.resourceId ?? null,
      certificateType: input.certificateType,
      title: input.title,
      description: input.description ?? null,
      studentName: input.studentName,
      issuerName: input.issuerName,
      courseName: input.courseName ?? null,
      score: input.score ?? null,
      maxScore: input.maxScore ?? null,
    },
  });
}

export async function findCertificateById(id: string) {
  return db.certificate.findUnique({ where: { id } });
}

export async function findByVerificationCode(code: string) {
  return db.certificate.findUnique({ where: { verificationCode: code } });
}

export async function findByStudent(studentId: string) {
  return db.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: "desc" },
  });
}

export async function findByClassroom(classroomId: string) {
  return db.certificate.findMany({
    where: { classroomId },
    orderBy: { issuedAt: "desc" },
  });
}

export async function findByAssessment(assessmentId: string) {
  return db.certificate.findMany({
    where: { assessmentId },
    orderBy: { issuedAt: "desc" },
  });
}

export async function findExistingForAttempt(
  studentId: string,
  assessmentId: string,
): Promise<boolean> {
  const count = await db.certificate.count({
    where: {
      studentId,
      assessmentId,
      revokedAt: null,
    },
  });
  return count > 0;
}

export async function revokeCertificate(
  id: string,
  reason: string,
  revokedById: string,
) {
  return db.certificate.update({
    where: { id },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
      revokedById,
    },
  });
}

export async function updatePdf(id: string, pdfBase64: string) {
  return db.certificate.update({
    where: { id },
    data: { pdfBase64 },
  });
}

export async function countAll(): Promise<number> {
  return db.certificate.count();
}
