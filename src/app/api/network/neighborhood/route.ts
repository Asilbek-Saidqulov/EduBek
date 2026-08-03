/**
 * GET /api/network/neighborhood — Get the collaboration neighborhood of an entity
 *
 * Query params:
 *   entityType — required
 *   entityId   — required
 *   edgeTypes  — optional comma-separated list (default: all 10 collaboration edges)
 *   limit      — optional (default 50)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCollaborationNeighborhood } from "@/features/collaboration";
import type { CollaborationEdgeType } from "@/features/collaboration";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  edgeTypes: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);
  const edgeTypes = parsed.edgeTypes
    ? (parsed.edgeTypes.split(",").filter(Boolean) as CollaborationEdgeType[])
    : undefined;
  const graph = await getCollaborationNeighborhood({
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    edgeTypes,
    limit: parsed.limit,
  });
  return NextResponse.json(graph);
});
