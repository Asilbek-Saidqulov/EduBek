/**
 * GET  /api/enterprise/marketplace — List marketplace apps
 * POST /api/enterprise/marketplace — Publish an app
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMarketplaceApps, publishMarketplaceApp } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  developerName: z.string().min(1).max(200),
  version: z.string().default("1.0.0"),
  pricingModel: z.enum(["free", "freemium", "paid"]).default("free"),
  priceEduTokens: z.number().int().min(0).default(0),
  configSchema: z.record(z.string(), z.unknown()).optional(),
  webhookUrl: z.string().url().optional(),
  screenshots: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const apps = await listMarketplaceApps({
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? "published",
    developerId: url.searchParams.get("developerId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ apps, total: apps.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const app = await publishMarketplaceApp({ ...body, developerId: ctx.userId });
  return NextResponse.json(app, { status: 201 });
});
