/**
 * GET  /api/enterprise/events — List event subscriptions
 * POST /api/enterprise/events — Create an event subscription
 * POST /api/enterprise/events/publish — Publish an event
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listEventSubscriptions, createEventSubscription, publishEvent } from "@/features/enterprise-integration";
import { z } from "zod";

const createSchema = z.object({
  eventTypes: z.array(z.string()).default(["*"]),
  deliveryMethod: z.enum(["webhook", "api", "email", "push"]).default("webhook"),
  deliveryTarget: z.string().min(1),
  organizationId: z.string().optional(),
  filter: z.record(z.string(), z.unknown()).optional(),
});

const publishSchema = z.object({
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const subs = await listEventSubscriptions({
    ownerId: ctx.userId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ subscriptions: subs, total: subs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "publish") {
    const body = publishSchema.parse(await req.json());
    await publishEvent(body.eventType, body.payload);
    return NextResponse.json({ success: true, eventType: body.eventType });
  }
  const body = createSchema.parse(await req.json());
  const sub = await createEventSubscription({ ...body, ownerId: ctx.userId });
  return NextResponse.json(sub, { status: 201 });
});
