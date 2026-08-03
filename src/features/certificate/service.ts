/**
 * EduBek — Certificate service.
 *
 * Lifecycle:
 *
 *   issue ──▶ (immutable) ──revoke──▶ (still immutable, but revoked)
 *
 * Verification is a public read endpoint — no auth required. Anyone with
 * the verification code can confirm a certificate's validity.
 *
 * PDF generation is a lightweight placeholder for Phase 4B — we render a
 * minimal base64 payload that the frontend can embed in an <iframe> or
 * download. A future phase can swap this for a real PDF generator (e.g.
 * react-pdf or a headless Chromium renderer).
 *
 * Authorization model:
 *   • issueCertificate — caller must hold PersonalPermission.CERTIFICATE_ISSUE
 *     and be the teacher of the relevant classroom (or superadmin).
 *   • revokeCertificate — same plus a non-empty reason.
 *   • getCertificate (own) — PersonalPermission.CERTIFICATE_VIEW_OWN.
 *   • getCertificate (other) / listByClassroom / listByAssessment —
 *     PersonalPermission.CERTIFICATE_ISSUE (teacher scope) or superadmin.
 *   • verifyByCode — public, no auth.
 *
 * Events published:
 *   • CERTIFICATE_ISSUED
 *   • CERTIFICATE_REVOKED
 *   • CERTIFICATE_VERIFIED (every verification attempt — audit trail)
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  CERTIFICATE_ISSUED,
  CERTIFICATE_REVOKED,
  CERTIFICATE_VERIFIED,
  type CertificateIssuedEvent,
  type CertificateRevokedEvent,
  type CertificateVerifiedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type {
  CertificateDto,
  CertificateType,
  CertificateVerificationResult,
  IssueCertificateInput,
} from "./types";
import type {
  IssueCertificateBody,
  ListCertificatesQuery,
  RevokeCertificateBody,
} from "./schema";

const log = getLogger("certificate-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCertificate(c: any): CertificateDto {
  return {
    id: c.id,
    verificationCode: c.verificationCode,
    certificateNumber: c.certificateNumber,
    studentId: c.studentId,
    issuedById: c.issuedById,
    classroomId: c.classroomId,
    assessmentId: c.assessmentId,
    resourceId: c.resourceId,
    certificateType: c.certificateType as CertificateType,
    title: c.title,
    description: c.description,
    studentName: c.studentName,
    issuerName: c.issuerName,
    courseName: c.courseName,
    score: c.score,
    maxScore: c.maxScore,
    issuedAt: c.issuedAt.toISOString(),
    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
    revokedReason: c.revokedReason,
    revokedById: c.revokedById,
    pdfBase64: c.pdfBase64,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Code + number generators
// ---------------------------------------------------------------------------

function generateVerificationCode(): string {
  // 16-char base32-ish code, no ambiguous chars. Sufficient entropy for
  // guess-resistant verification URLs.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  // Insert a hyphen every 4 chars for readability.
  return out.match(/.{4}/g)!.join("-");
}

async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await repo.countAll();
  const seq = String(count + 1).padStart(5, "0");
  return `EDUBEK-${year}-${seq}`;
}

// ---------------------------------------------------------------------------
// PDF generation (placeholder)
// ---------------------------------------------------------------------------

function renderPdfPlaceholder(input: {
  title: string;
  studentName: string;
  issuerName: string;
  courseName: string | null;
  score: number | null;
  maxScore: number | null;
  issuedAt: string;
  certificateNumber: string;
  verificationCode: string;
  /** Phase 4E.3: locale for date formatting (default "en"). */
  locale?: string;
  /** Phase 4E.3: timezone for date formatting (default UTC). */
  timezone?: string;
}): string {
  const locale = input.locale ?? "en";
  const timezone = input.timezone ?? "UTC";
  // Phase 4E.3: use Intl.DateTimeFormat with explicit locale + timezone
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(input.issuedAt));

  // Phase 4E.3: labels are now translation keys; the HTML uses English
  // fallbacks. The frontend can re-render with localized labels if needed.
  const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"><title>${input.title}</title>
<style>body{font-family:Georgia,serif;padding:60px;text-align:center;border:2px solid #1e3a8a;margin:40px}
h1{color:#1e3a8a;margin-bottom:8px}
.subtitle{color:#64748b;margin-bottom:32px}
.student{font-size:28px;margin:24px 0 8px}
.course{font-size:18px;color:#475569;margin-bottom:32px}
.score{font-size:20px;margin:16px 0}
.footer{margin-top:48px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}
.code{font-family:monospace;font-size:14px;letter-spacing:2px;color:#1e3a8a}
</style></head><body>
<h1>Certificate of Achievement</h1>
<div class="subtitle">${input.title}</div>
<div class="student">${input.studentName}</div>
<div class="course">${input.courseName ?? ""}</div>
${input.score != null ? `<div class="score">Score: ${input.score}${input.maxScore != null ? ` / ${input.maxScore}` : ""}</div>` : ""}
<div>Issued by ${input.issuerName} on ${formattedDate}</div>
<div class="footer">
  Certificate #${input.certificateNumber}<br>
  Verification code: <span class="code">${input.verificationCode}</span>
</div>
</body></html>`;
  // Base64-encode the HTML.
  return Buffer.from(html, "utf-8").toString("base64");
}

// ---------------------------------------------------------------------------
// issueCertificate
// ---------------------------------------------------------------------------

export async function issueCertificate(
  ctx: AuthContext,
  input: IssueCertificateBody,
): Promise<CertificateDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.CERTIFICATE_ISSUE)) {
    throw forbidden("No permission to issue certificates");
  }

  // Resolve the student's name from the User record.
  const student = await db.user.findUnique({
    where: { id: input.studentId },
    select: { id: true, name: true, email: true },
  });
  if (!student) throw notFound("Student not found");

  // Resolve the issuer's name.
  const issuer = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { name: true, email: true },
  });
  if (!issuer) throw notFound("Issuer user not found");

  // If classroomId is provided, verify caller is the teacher.
  if (input.classroomId) {
    const classroom = await db.classroom.findUnique({
      where: { id: input.classroomId },
      select: { teacherId: true, name: true },
    });
    if (!classroom) throw notFound("Classroom not found");
    if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only the classroom teacher can issue certificates for this classroom");
    }
  }

  // Idempotency: don't issue a duplicate certificate for the same
  // (student, assessment) pair.
  if (input.assessmentId) {
    const exists = await repo.findExistingForAttempt(input.studentId, input.assessmentId);
    if (exists) {
      throw badRequest("Student already has a non-revoked certificate for this assessment");
    }
  }

  const verificationCode = generateVerificationCode();
  const certificateNumber = await generateCertificateNumber();

  const created = await repo.createCertificate({
    verificationCode,
    certificateNumber,
    studentId: input.studentId,
    issuedById: ctx.userId,
    classroomId: input.classroomId,
    assessmentId: input.assessmentId,
    resourceId: input.resourceId,
    certificateType: input.certificateType,
    title: input.title,
    description: input.description,
    studentName: student.name ?? student.email,
    issuerName: issuer.name ?? issuer.email,
    courseName: input.courseName,
    score: input.score,
    maxScore: input.maxScore,
  });

  // Generate the PDF placeholder and cache it.
  const pdfBase64 = renderPdfPlaceholder({
    title: created.title,
    studentName: created.studentName,
    issuerName: created.issuerName,
    courseName: created.courseName,
    score: created.score,
    maxScore: created.maxScore,
    issuedAt: created.issuedAt.toISOString(),
    certificateNumber: created.certificateNumber,
    verificationCode: created.verificationCode,
  });
  await repo.updatePdf(created.id, pdfBase64);

  const withPdf = await repo.findCertificateById(created.id);

  eventBus.publish(
    buildEvent<CertificateIssuedEvent>({
      type: CERTIFICATE_ISSUED,
      actorId: ctx.userId,
      certificateId: created.id,
      verificationCode: created.verificationCode,
      studentId: created.studentId,
      issuedById: ctx.userId,
      assessmentId: created.assessmentId,
    }),
  );

  log.info("certificate.issued", {
    certificateId: created.id,
    studentId: created.studentId,
  });

  return mapCertificate(withPdf);
}

// ---------------------------------------------------------------------------
// getCertificate
// ---------------------------------------------------------------------------

export async function getCertificate(
  ctx: AuthContext,
  id: string,
): Promise<CertificateDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const cert = await repo.findCertificateById(id);
  if (!cert) throw notFound("Certificate not found");
  if (cert.studentId === ctx.userId) {
    if (!can(ctx, PersonalPermission.CERTIFICATE_VIEW_OWN)) {
      throw forbidden("No permission to view own certificates");
    }
  } else {
    if (!can(ctx, PersonalPermission.CERTIFICATE_ISSUE) && !ctx.isSuperadmin) {
      throw forbidden("No permission to view other certificates");
    }
  }
  return mapCertificate(cert);
}

// ---------------------------------------------------------------------------
// listMyCertificates
// ---------------------------------------------------------------------------

export async function listMyCertificates(ctx: AuthContext): Promise<CertificateDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.CERTIFICATE_VIEW_OWN)) {
    throw forbidden("No permission to view own certificates");
  }
  const certs = await repo.findByStudent(ctx.userId);
  return certs.map(mapCertificate);
}

// ---------------------------------------------------------------------------
// listCertificates (teacher / admin)
// ---------------------------------------------------------------------------

export async function listCertificates(
  ctx: AuthContext,
  query: ListCertificatesQuery,
): Promise<{ certificates: CertificateDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.CERTIFICATE_ISSUE) && !ctx.isSuperadmin) {
    throw forbidden("No permission to list certificates");
  }
  let certs: any[];
  if (query.studentId) {
    certs = await repo.findByStudent(query.studentId);
  } else if (query.classroomId) {
    // Verify the caller is the teacher of this classroom.
    const classroom = await db.classroom.findUnique({
      where: { id: query.classroomId },
      select: { teacherId: true },
    });
    if (!classroom) throw notFound("Classroom not found");
    if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only the classroom teacher can list certificates for this classroom");
    }
    certs = await repo.findByClassroom(query.classroomId);
  } else if (query.assessmentId) {
    certs = await repo.findByAssessment(query.assessmentId);
  } else {
    // Fall back to the caller's issued certificates.
    const { db } = await import("@/lib/db");
    certs = await db.certificate.findMany({
      where: { issuedById: ctx.userId },
      orderBy: { issuedAt: "desc" },
    });
  }
  return {
    certificates: certs.map(mapCertificate),
    total: certs.length,
  };
}

// ---------------------------------------------------------------------------
// verifyByCode (public, no auth)
// ---------------------------------------------------------------------------

export async function verifyByCode(
  code: string,
): Promise<CertificateVerificationResult> {
  const cert = await repo.findByVerificationCode(code);
  const verifiedAt = new Date().toISOString();

  if (!cert) {
    eventBus.publish(
      buildEvent<CertificateVerifiedEvent>({
        type: CERTIFICATE_VERIFIED,
        actorId: undefined,
        certificateId: "",
        verificationCode: code,
        verified: false,
      }),
    );
    return { valid: false, revoked: false, certificate: null, verifiedAt };
  }

  const revoked = cert.revokedAt !== null;
  const valid = !revoked;

  eventBus.publish(
    buildEvent<CertificateVerifiedEvent>({
      type: CERTIFICATE_VERIFIED,
      actorId: undefined,
      certificateId: cert.id,
      verificationCode: code,
      verified: valid,
    }),
  );

  return {
    valid,
    revoked,
    certificate: mapCertificate(cert),
    verifiedAt,
  };
}

// ---------------------------------------------------------------------------
// revokeCertificate
// ---------------------------------------------------------------------------

export async function revokeCertificate(
  ctx: AuthContext,
  id: string,
  input: RevokeCertificateBody,
): Promise<CertificateDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.CERTIFICATE_ISSUE)) {
    throw forbidden("No permission to revoke certificates");
  }
  const cert = await repo.findCertificateById(id);
  if (!cert) throw notFound("Certificate not found");
  if (cert.revokedAt) {
    throw badRequest("Certificate is already revoked");
  }

  // If the certificate is classroom-scoped, verify caller is the teacher.
  if (cert.classroomId) {
    const classroom = await db.classroom.findUnique({
      where: { id: cert.classroomId },
      select: { teacherId: true },
    });
    if (!classroom) throw notFound("Classroom not found");
    if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
      throw forbidden("Only the classroom teacher can revoke this certificate");
    }
  } else if (cert.issuedById !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the issuer can revoke this certificate");
  }

  const revoked = await repo.revokeCertificate(id, input.reason, ctx.userId);

  eventBus.publish(
    buildEvent<CertificateRevokedEvent>({
      type: CERTIFICATE_REVOKED,
      actorId: ctx.userId,
      certificateId: revoked.id,
      verificationCode: revoked.verificationCode,
      revokedById: ctx.userId,
      reason: input.reason,
    }),
  );

  log.info("certificate.revoked", { certificateId: id, reason: input.reason });

  return mapCertificate(revoked);
}
