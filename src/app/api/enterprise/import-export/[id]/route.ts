/** GET /api/enterprise/import-export/:id — Get job; POST :id/process — Process job */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getImportExportJob, processImportExportJob } from "@/features/enterprise-integration";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const job = await getImportExportJob(id);
  if (!job) throw notFound("Job not found");
  return NextResponse.json(job);
});

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const job = await processImportExportJob(id);
  return NextResponse.json(job);
});
