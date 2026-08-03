/**
 * POST /api/discovery/analytics — Record a recommendation event
 *   (impression / click / open / complete / ignore / dismiss / helpful / not_helpful)
 *
 * GET  /api/discovery/analytics — Get recommendation analytics summary for the user.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  recordRecommendationEvent,
  getRecommendationAnalytics,
  type RecommendationEventType,
} from "@/features/semantic-search";
import { z } from "zod";

const EVENT_TYPES = [
  "impression",
  "click",
  "open",
  "complete",
  "ignore",
  "dismiss",
  "helpful",
  "not_helpful",
] as const;

const postSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  eventType: z.enum(EVENT_TYPES),
  strategy: z.string().optional(),
  surface: z.string().optional(), // 'feed' | 'next_step' | 'search' | 'related'
  position: z.number().int().min(1).optional(),
  locale: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  // Anonymous events allowed (impressions can happen pre-auth) but userId attached when available.
  const body = postSchema.parse(await req.json());

  await recordRecommendationEvent({
    userId: ctx.userId,
    entityType: body.entityType,
    entityId: body.entityId,
    eventType: body.eventType as RecommendationEventType,
    strategy: body.strategy,
    surface: body.surface,
    position: body.position,
    locale: ctx.locale ?? body.locale,
  });

  return NextResponse.json({ success: true });
});

const getSchema = z.object({
  sinceDays: z.coerce.number().int().min(1).max(365).default(30),
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
  const params = Object.fromEntries(url.searchParams);
  const { sinceDays } = getSchema.parse(params);

  const summary = await getRecommendationAnalytics(ctx.userId, sinceDays);

  return NextResponse.json(summary);
});
