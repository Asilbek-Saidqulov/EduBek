/** GET /api/search/semantic — Hybrid semantic search with explainable ranking */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { semanticSearch, listAvailableProviders } from "@/features/semantic-search";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(1).max(500),
  locale: z.string().min(2).max(5).optional(),
  types: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  hybrid: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
  intent: z
    .enum([
      "learn_concept",
      "prepare_exam",
      "find_worksheet",
      "generate_quiz",
      "create_lesson",
      "review_mistakes",
      "homework_help",
      "research",
    ])
    .optional(),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);

  const results = await semanticSearch({
    query: parsed.query,
    locale: ctx.locale ?? parsed.locale ?? "en",
    userId: ctx.userId,
    entityTypes: parsed.types?.split(",").filter(Boolean),
    limit: parsed.limit,
    hybrid: parsed.hybrid,
    intent: parsed.intent,
    organizationId: parsed.organizationId,
  });

  return NextResponse.json(results);
});

/** GET /api/search/semantic/providers — List available embedding providers */
export const GET_PROVIDERS = withErrorHandler(async () => {
  return NextResponse.json({ providers: listAvailableProviders() });
});
