/**
 * GET /api/product/journey — List journey templates and active journeys
 * POST /api/product/journey — Start a new journey
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listJourneyTemplates, startJourney, getActiveJourney, listUserJourneys,
} from "@/features/product-intelligence";
import type { JourneyKind } from "@/features/product-intelligence";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const [templates, active, journeys] = await Promise.all([
    Promise.resolve(listJourneyTemplates()),
    getActiveJourney(ctx.userId),
    listUserJourneys(ctx.userId),
  ]);
  return NextResponse.json({ templates, active, journeys });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind ?? "") as JourneyKind;
  if (!kind) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "kind is required" } }, { status: 400 });
  }
  const journey = await startJourney(ctx.userId, kind);
  return NextResponse.json(journey, { status: 201 });
});
