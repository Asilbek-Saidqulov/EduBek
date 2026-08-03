/**
 * GET /api/discovery/graph?type=resource&id=abc123&depth=2
 *
 * Phase 4F.1: Traverse the Knowledge Graph from any entity.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getGraphTraversal, type DiscoveryEntityType } from "@/features/discovery";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  depth: z.coerce.number().int().min(1).max(5).default(2),
});

export const GET = withErrorHandler(async (req) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { type, id, depth } = schema.parse(params);

  const graph = await getGraphTraversal(type as DiscoveryEntityType, id, depth);
  return NextResponse.json(graph);
});
