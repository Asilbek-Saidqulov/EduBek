/** GET /api/search/suggestions — Auto-complete search suggestions */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSearchSuggestions } from "@/features/semantic-search";
import { z } from "zod";

const schema = z.object({
  q: z.string().min(1).max(200),
  locale: z.string().min(2).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { q, locale, limit } = schema.parse(params);

  const suggestions = await getSearchSuggestions({
    query: q,
    locale: ctx.locale ?? locale,
    limit,
  });

  return NextResponse.json({ suggestions });
});
