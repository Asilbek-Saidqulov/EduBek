/**
 * GET  /api/assessment-platform/credentials — List credentials
 * POST /api/assessment-platform/credentials — Issue a credential
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCredentials, issueCredential } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["certificate", "badge", "micro_credential", "competency_certificate", "course_certificate", "organization_certificate"]),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  userId: z.string().min(1),
  issuerId: z.string().min(1),
  issuerType: z.string().default("organization"),
  competencyIds: z.array(z.string()).optional(),
  evidenceLinks: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const credentials = await listCredentials({
    userId: url.searchParams.get("userId") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ credentials, total: credentials.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const credential = await issueCredential({
    ...body,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });
  return NextResponse.json(credential, { status: 201 });
});
