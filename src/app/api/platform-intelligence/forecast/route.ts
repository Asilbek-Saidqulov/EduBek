/**
 * GET  /api/platform-intelligence/forecast — List forecasts
 * POST /api/platform-intelligence/forecast — Run a new forecast
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { runPlatformForecast, listPlatformForecasts } from "@/features/platform-intelligence";
import { z } from "zod";

const postSchema = z.object({
  type: z.enum([
    "dropout", "exam_success", "resource_popularity", "marketplace_demand",
    "teacher_workload", "ai_credit_usage", "resource_decay", "curriculum_gaps",
    "search_trends", "topic_popularity",
  ]),
  scopeType: z.string().optional(),
  scopeId: z.string().optional(),
  horizon: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
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
  const forecasts = await listPlatformForecasts({
    type: url.searchParams.get("type") as any ?? undefined,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return NextResponse.json({ forecasts, total: forecasts.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = postSchema.parse(await req.json());
  const forecast = await runPlatformForecast(body);
  return NextResponse.json(forecast, { status: 201 });
});
