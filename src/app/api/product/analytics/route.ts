/**
 * GET /api/product/analytics — Generate product analytics report
 * POST /api/product/analytics — Track an analytics event
 *
 * Query params (GET):
 *   - sinceDays (number, default 30)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateAnalyticsReport, trackEvent } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const sinceDays = parseInt(url.searchParams.get("sinceDays") ?? "30", 10);
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const report = await generateAnalyticsReport({ since });
  return NextResponse.json(report);
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { eventType, feature, location, metadata, frictionScore, durationMs } = body as Record<string, unknown>;
  if (!eventType) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "eventType is required" } }, { status: 400 });
  }
  await trackEvent({
    userId: ctx.userId,
    eventType: String(eventType),
    feature: feature ? String(feature) : undefined,
    location: location ? String(location) : undefined,
    metadata: metadata as Record<string, unknown> | undefined,
    frictionScore: typeof frictionScore === "number" ? frictionScore : undefined,
    durationMs: typeof durationMs === "number" ? durationMs : undefined,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});
