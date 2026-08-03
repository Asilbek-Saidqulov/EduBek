/**
 * GET /api/certificates/mine  — list the caller's certificates
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMyCertificates } from "@/features/certificate";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const certs = await listMyCertificates(ctx);
  return NextResponse.json({ certificates: certs });
});
