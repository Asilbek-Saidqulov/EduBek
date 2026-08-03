/**
 * EduBek — Certificate feature domain types (DTOs).
 *
 * Certificates are IMMUTABLE. Revoking a certificate sets `revokedAt` +
 * `revokedReason`; the row is never deleted and the verification code
 * remains valid (it just returns "revoked" instead of "valid").
 */
export type CertificateType = "assessment" | "course" | "achievement";

export interface CertificateDto {
  id: string;
  verificationCode: string;
  certificateNumber: string;
  studentId: string;
  issuedById: string;
  classroomId: string | null;
  assessmentId: string | null;
  resourceId: string | null;
  certificateType: CertificateType;
  title: string;
  description: string | null;
  studentName: string;
  issuerName: string;
  courseName: string | null;
  score: number | null;
  maxScore: number | null;
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  revokedById: string | null;
  pdfBase64: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  revoked: boolean;
  certificate: CertificateDto | null;
  verifiedAt: string;
}

export interface IssueCertificateInput {
  studentId: string;
  classroomId?: string;
  assessmentId?: string;
  resourceId?: string;
  certificateType?: CertificateType;
  title: string;
  description?: string;
  courseName?: string;
  score?: number;
  maxScore?: number;
}
