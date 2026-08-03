/**
 * POST /api/certificates       — issue a certificate
 * GET  /api/certificates       — list certificates (teacher scope)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  issueCertificate,
  listCertificates,
  issueCertificateBodySchema,
  listCertificatesQuerySchema,
} from "@/features/certificate";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = issueCertificateBodySchema.parse(await req.json());
  const cert = await issueCertificate(ctx, body);
  return NextResponse.json(cert, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listCertificatesQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listCertificates(ctx, query);
  return NextResponse.json(result);
});
