/** EduBek — Assessment Platform repository. */
import { db } from "@/lib/db";

// Competency
export const createCompetency = (input: any) => db.competency.create({ data: input });
export const findCompetency = (id: string) => db.competency.findUnique({ where: { id } });
export const findCompetencyByCode = (code: string) => db.competency.findUnique({ where: { code } });
export const findCompetencies = (input: any) => { const { limit, ...where } = input; return db.competency.findMany({ where, take: limit ?? 100, orderBy: { name: "asc" } }); };
export const updateCompetency = (id: string, data: any) => db.competency.update({ where: { id }, data });

// Competency Evidence
export const createCompetencyEvidence = (input: any) => db.competencyEvidence.create({ data: input });
export const findCompetencyEvidence = (input: any) => { const { limit, ...where } = input; return db.competencyEvidence.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateCompetencyEvidence = (id: string, data: any) => db.competencyEvidence.update({ where: { id }, data });

// Digital Credential
export const createCredential = (input: any) => db.digitalCredential.create({ data: input });
export const findCredential = (id: string) => db.digitalCredential.findUnique({ where: { id } });
export const findCredentialByVerificationId = (vid: string) => db.digitalCredential.findUnique({ where: { verificationId: vid } });
export const findCredentials = (input: any) => { const { limit, ...where } = input; return db.digitalCredential.findMany({ where, orderBy: { issuedAt: "desc" }, take: limit ?? 100 }); };
export const updateCredential = (id: string, data: any) => db.digitalCredential.update({ where: { id }, data });

// Transcript
export const upsertTranscript = (input: any) => db.academicTranscript.upsert({ where: { userId: input.userId }, create: input, update: input });
export const findTranscript = (userId: string) => db.academicTranscript.findUnique({ where: { userId } });

// Assessment Item
export const createAssessmentItem = (input: any) => db.assessmentItem.create({ data: input });
export const findAssessmentItems = (input: any) => { const { limit, ...where } = input; return db.assessmentItem.findMany({ where, take: limit ?? 500 }); };
export const updateAssessmentItem = (id: string, data: any) => db.assessmentItem.update({ where: { id }, data });

// Assessment Quality
export const upsertAssessmentQuality = (input: any) => db.assessmentQuality.upsert({ where: { assessmentId: input.assessmentId }, create: input, update: input });
export const findAssessmentQuality = (assessmentId: string) => db.assessmentQuality.findUnique({ where: { assessmentId } });

// Integrity Check
export const createIntegrityCheck = (input: any) => db.integrityCheck.create({ data: input });
export const findIntegrityChecks = (input: any) => { const { limit, ...where } = input; return db.integrityCheck.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateIntegrityCheck = (id: string, data: any) => db.integrityCheck.update({ where: { id }, data });

// Secure Exam Session
export const createSecureExamSession = (input: any) => db.secureExamSession.create({ data: input });
export const findSecureExamSession = (assessmentId: string, userId: string) => db.secureExamSession.findUnique({ where: { assessmentId_userId: { assessmentId, userId } } });
export const findSecureExamSessions = (input: any) => { const { limit, ...where } = input; return db.secureExamSession.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateSecureExamSession = (id: string, data: any) => db.secureExamSession.update({ where: { id }, data });

// Assessment Blueprint
export const createBlueprint = (input: any) => db.assessmentBlueprint.create({ data: input });
export const findBlueprint = (id: string) => db.assessmentBlueprint.findUnique({ where: { id } });
export const findBlueprints = (input: any) => { const { limit, ...where } = input; return db.assessmentBlueprint.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateBlueprint = (id: string, data: any) => db.assessmentBlueprint.update({ where: { id }, data });

// Accreditation Report
export const upsertAccreditationReport = (input: any) => db.accreditationReport.upsert({ where: { organizationId_day: { organizationId: input.organizationId, day: input.day } }, create: input, update: input });
export const findAccreditationReport = (orgId: string, day?: Date) => day ? db.accreditationReport.findUnique({ where: { organizationId_day: { organizationId: orgId, day } } }) : db.accreditationReport.findFirst({ where: { organizationId: orgId }, orderBy: { day: "desc" } });

// Credential Verification
export const createCredentialVerification = (input: any) => db.credentialVerification.create({ data: input });
export const findCredentialVerifications = (input: any) => { const { limit, ...where } = input; return db.credentialVerification.findMany({ where, orderBy: { verifiedAt: "desc" }, take: limit ?? 50 }); };
