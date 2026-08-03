/**
 * EduBek — Certificate feature barrel export.
 */
export {
  issueCertificate,
  getCertificate,
  listMyCertificates,
  listCertificates,
  verifyByCode,
  revokeCertificate,
} from "./service";

export {
  issueCertificateBodySchema,
  revokeCertificateBodySchema,
  listCertificatesQuerySchema,
  type IssueCertificateBody,
  type RevokeCertificateBody,
  type ListCertificatesQuery,
} from "./schema";

export type {
  CertificateType,
  CertificateDto,
  CertificateVerificationResult,
  IssueCertificateInput,
} from "./types";
