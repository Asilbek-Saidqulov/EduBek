/**
 * GET  /api/data-fabric/federated — List federated learning jobs
 * POST /api/data-fabric/federated — Create / contribute / aggregate
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listFederatedJobs, createFederatedJob, contributeToFederatedJob, aggregateFederatedJob } from "@/features/data-fabric";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["model_training", "parameter_aggregation", "evaluation"]),
  modelType: z.enum(["recommendation", "ranking", "prediction", "grading"]),
  participants: z.array(z.object({ orgId: z.string(), contributed: z.boolean() })).optional(),
  privacySettings: z.record(z.string(), z.unknown()).optional(),
});

const contributeSchema = z.object({
  action: z.literal("contribute"), jobId: z.string(), orgId: z.string(),
  params: z.record(z.string(), z.unknown()), quality: z.number().min(0).max(1),
});

const aggregateSchema = z.object({ action: z.literal("aggregate"), jobId: z.string() });

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const jobs = await listFederatedJobs({
    type: url.searchParams.get("type") ?? undefined,
    modelType: url.searchParams.get("modelType") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ jobs, total: jobs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  if (body.action === "contribute") {
    const parsed = contributeSchema.parse(body);
    const job = await contributeToFederatedJob(parsed.jobId, parsed.orgId, parsed.params, parsed.quality);
    return NextResponse.json(job);
  }
  if (body.action === "aggregate") {
    const parsed = aggregateSchema.parse(body);
    const job = await aggregateFederatedJob(parsed.jobId);
    return NextResponse.json(job);
  }
  const parsed = createSchema.parse(body);
  const job = await createFederatedJob(parsed);
  return NextResponse.json(job, { status: 201 });
});
