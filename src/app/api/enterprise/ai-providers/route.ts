/**
 * GET  /api/enterprise/ai-providers — List external AI providers
 * POST /api/enterprise/ai-providers — Register an AI provider
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAiProviders, registerAiProvider, toggleAiProvider } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  provider: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  capabilities: z.array(z.string()).default(["chat"]),
  models: z.array(z.object({
    id: z.string(), name: z.string(),
    contextWindow: z.number().optional(),
    inputCostPer1k: z.number().optional(),
    outputCostPer1k: z.number().optional(),
  })).default([]),
  defaultModel: z.string().optional(),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const providers = await listAiProviders({
    provider: url.searchParams.get("provider") ?? undefined,
    enabled: url.searchParams.get("enabled") === "true" ? true : undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ providers, total: providers.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const provider = await registerAiProvider(body);
  return NextResponse.json(provider, { status: 201 });
});
