/**
 * POST /api/discovery/reindex — Re-index embeddings for a batch of entities (admin)
 *
 * Body:
 *   { entityType?: string, limit?: number }
 *
 * If entityType is omitted, re-indexes ALL entity types (slow). Otherwise
 * only re-indexes the specified type. The `limit` parameter caps the
 * number of entities to re-index in a single request (default 100, max 1000).
 *
 * Uses incremental indexing — entities whose content hash is unchanged
 * are skipped (no API call to the embedding provider).
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { indexEmbeddingsBatch } from "@/features/semantic-search";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }

  const body = schema.parse(await req.json());

  // Fetch candidate entities from the search index — these are the
  // canonical "searchable" entities that should have embeddings.
  const entries = await db.searchIndexEntry.findMany({
    where: body.entityType ? { entityType: body.entityType } : undefined,
    take: body.limit,
    orderBy: { updatedAt: "desc" },
    select: { entityType: true, entityId: true, title: true, searchText: true, description: true },
  });

  const inputs = entries.map((e) => ({
    entityType: e.entityType,
    entityId: e.entityId,
    text: [e.title, e.description ?? "", e.searchText ?? ""].filter(Boolean).join(" "),
  }));

  const result = await indexEmbeddingsBatch(inputs);

  return NextResponse.json({
    success: true,
    total: entries.length,
    indexed: result.indexed,
    skipped: result.skipped,
  });
});
