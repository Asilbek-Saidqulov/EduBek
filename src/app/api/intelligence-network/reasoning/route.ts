/** GET+POST /api/intelligence-network/reasoning — List/reason with educational reasoning engine */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReasoningChains, reason } from "@/features/global-intelligence";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(1).max(2000),
  domain: z.string().optional(),
  language: z.string().default("en"),
  modelUsed: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const chains = await listReasoningChains({
    domain: url.searchParams.get("domain") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ chains, total: chains.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const chain = await reason(body);
  return NextResponse.json(chain, { status: 201 });
});
