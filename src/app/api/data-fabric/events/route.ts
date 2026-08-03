/**
 * GET  /api/data-fabric/events — List events from the event store
 * POST /api/data-fabric/events — Append an event
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getEvents, appendEvent, reconstructState } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1), entityType: z.string().min(1), entityId: z.string().min(1),
  organizationId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const eventType = url.searchParams.get("type") ?? undefined;
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const entityId = url.searchParams.get("entityId") ?? undefined;
  const reconstruct = url.searchParams.get("reconstruct") === "true";

  if (reconstruct && entityType && entityId) {
    const state = await reconstructState(entityType, entityId);
    return NextResponse.json({ reconstructedState: state });
  }

  const events = await getEvents({
    type: eventType, entityType, entityId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 500),
  });
  return NextResponse.json({ events, total: events.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const event = await appendEvent(body);
  return NextResponse.json(event, { status: 201 });
});
