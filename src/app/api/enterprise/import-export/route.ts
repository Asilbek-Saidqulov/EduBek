/**
 * GET  /api/enterprise/import-export — List import/export jobs
 * POST /api/enterprise/import-export — Create a job
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listImportExportJobs, createImportExportJob } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  direction: z.enum(["import", "export"]),
  format: z.enum(["csv", "excel", "qti", "ims_cc", "moodle_backup", "canvas_export", "pdf", "docx", "json", "xml"]),
  entityType: z.string().min(1),
  organizationId: z.string().optional(),
  fileName: z.string().optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const jobs = await listImportExportJobs({
    direction: url.searchParams.get("direction") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    initiatedBy: ctx.userId,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ jobs, total: jobs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const job = await createImportExportJob({ ...body, initiatedBy: ctx.userId });
  return NextResponse.json(job, { status: 201 });
});
