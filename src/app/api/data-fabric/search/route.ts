/**
 * GET  /api/data-fabric/search — Global search across all entities
 * POST /api/data-fabric/search — Index an entity in the global search index
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { globalSearch, indexEntity } from "@/features/data-fabric";
import { z } from "zod";

const indexSchema = z.object({
  entityType: z.string().min(1), entityId: z.string().min(1),
  organizationId: z.string().optional(), searchText: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  popularity: z.number().min(0).max(1).optional(),
  quality: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
  isMarketplace: z.boolean().optional(), isAiGenerated: z.boolean().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  if (!query) return NextResponse.json({ results: [], total: 0 });
  const types = url.searchParams.get("types")?.split(",").filter(Boolean);
  const result = await globalSearch({
    query,
    entityTypes: types,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json(result);
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = indexSchema.parse(await req.json());
  await indexEntity(body);
  return NextResponse.json({ success: true }, { status: 201 });
});
