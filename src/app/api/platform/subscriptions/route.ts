/**
 * GET  /api/platform/subscriptions — List subscriptions
 * POST /api/platform/subscriptions — Subscribe to an extension
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSubscriptions, subscribeToExtension } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({
  extensionId: z.string().min(1), organizationId: z.string().optional(), userId: z.string().optional(),
  plan: z.enum(["free", "monthly", "yearly"]).default("free"), pricePerCycle: z.number().int().min(0).default(0),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const subs = await listSubscriptions({
    extensionId: url.searchParams.get("extensionId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    userId: url.searchParams.get("userId") ?? ctx.userId,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ subscriptions: subs, total: subs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const sub = await subscribeToExtension(body);
  return NextResponse.json(sub, { status: 201 });
});
