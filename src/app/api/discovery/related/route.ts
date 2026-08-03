/**
 * GET /api/discovery/related?type=resource&id=abc123
 *
 * Phase 4F.1: Get related content for any entity via the Knowledge Graph.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getRelatedContent, type DiscoveryEntityType } from "@/features/discovery";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = withErrorHandler(async (req) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { type, id, limit } = schema.parse(params);

  const related = await getRelatedContent(type as DiscoveryEntityType, id, limit);
  return NextResponse.json({ related });
});
