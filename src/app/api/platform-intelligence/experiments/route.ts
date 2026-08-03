/**
 * GET  /api/platform-intelligence/experiments — List experiments
 * POST /api/platform-intelligence/experiments — Create an experiment
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createPlatformExperiment,
  listPlatformExperiments,
  startExperiment,
  pauseExperiment,
  finalizePlatformExperiment,
  getExperimentResultsDto,
} from "@/features/platform-intelligence";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["ab_test", "ranking", "prompt", "recommendation", "search", "marketplace", "planner", "feature_flag"]),
  variants: z.array(z.object({
    name: z.string().min(1).max(50),
    weight: z.number().int().min(1).max(100),
  })).min(2),
  rolloutPct: z.number().int().min(1).max(100).default(100),
  successMetric: z.string().default("ctr"),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const experiments = await listPlatformExperiments({
    type: url.searchParams.get("type") as any ?? undefined,
    status: url.searchParams.get("status") as any ?? undefined,
    ownerId: url.searchParams.get("ownerId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ experiments, total: experiments.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = createSchema.parse(await req.json());
  const experiment = await createPlatformExperiment({
    ...body,
    ownerId: ctx.userId,
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
  });
  return NextResponse.json(experiment, { status: 201 });
});
