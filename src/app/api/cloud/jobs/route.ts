/**
 * GET  /api/cloud/jobs — List jobs
 * POST /api/cloud/jobs — Submit a job
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listJobs, submitJob } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1), queue: z.string().default("default"),
  priority: z.number().int().min(1).max(10).default(5),
  payload: z.record(z.string(), z.unknown()).default({}),
  maxRetries: z.number().int().min(0).max(10).default(3),
  timeoutMs: z.number().int().min(1000).max(3600000).default(300000),
  scheduledFor: z.string().datetime().optional(),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const jobs = await listJobs({
    type: url.searchParams.get("type") ?? undefined,
    queue: url.searchParams.get("queue") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ jobs, total: jobs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const job = await submitJob({ ...body, createdBy: ctx.userId, scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined });
  return NextResponse.json(job, { status: 201 });
});
