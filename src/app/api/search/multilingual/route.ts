/**
 * GET /api/search/multilingual?query=photosynthesis&locale=uz
 *
 * Phase 4E.6: Cross-language search endpoint.
 * Searches across all languages using alias expansion and returns
 * results ranked by language preference.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { multilingualSearch } from "@/features/multilingual-search";
import { z } from "zod";

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  locale: z.string().min(2).max(5).default("en"),
  searchAllLanguages: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
  resourceType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const query = searchQuerySchema.parse(params);

  const results = await multilingualSearch({
    query: query.query,
    locale: ctx.locale ?? query.locale,
    searchAllLanguages: query.searchAllLanguages,
    resourceType: query.resourceType,
    page: query.page,
    pageSize: query.pageSize,
  });

  return NextResponse.json(results);
});
