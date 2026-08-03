/** GET+POST /api/cloud/documents — List/submit document jobs */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listDocumentJobs, submitDocumentJob } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  documentType: z.enum(["pdf", "docx", "pptx", "epub", "scanned"]),
  inputUrl: z.string().min(1), organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const jobs = await listDocumentJobs({
    status: url.searchParams.get("status") ?? undefined,
    documentType: url.searchParams.get("documentType") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ jobs, total: jobs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const job = await submitDocumentJob(body);
  return NextResponse.json(job, { status: 201 });
});
