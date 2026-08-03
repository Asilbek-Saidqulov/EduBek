/**
 * GET  /api/data-fabric/streams — List stream subscriptions
 * POST /api/data-fabric/streams — Create a stream subscription
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listStreamSubscriptions, createStreamSubscription } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  streamType: z.string().min(1),
  filter: z.record(z.string(), z.unknown()).optional(),
  deliveryMethod: z.enum(["webhook", "websocket", "polling", "lambda"]).default("webhook"),
  deliveryTarget: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const subs = await listStreamSubscriptions({
    subscriberId: ctx.userId,
    streamType: url.searchParams.get("streamType") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ subscriptions: subs, total: subs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const sub = await createStreamSubscription({ ...body, subscriberId: ctx.userId });
  return NextResponse.json(sub, { status: 201 });
});
