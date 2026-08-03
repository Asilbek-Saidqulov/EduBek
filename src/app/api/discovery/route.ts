/**
 * POST /api/discovery
 *
 * Phase 4F.1: Index an entity in the discovery layer.
 * Also creates a knowledge graph node.
 *
 * This is an internal API called by other services (resource, marketplace,
 * classroom, etc.) when entities are created or updated.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { indexEntity, linkEntities, type DiscoveryEntityType, type EdgeType } from "@/features/discovery";
import { z } from "zod";

const indexSchema = z.object({
  action: z.enum(["index", "link"]).default("index"),
  // For "index" action:
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  language: z.string().optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
  difficulty: z.string().optional(),
  resourceType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
  orgId: z.string().optional(),
  price: z.number().optional(),
  isMarketplace: z.boolean().optional(),
  isAiGenerated: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  popularity: z.number().optional(),
  quality: z.number().optional(),
  // For "link" action:
  fromEntityType: z.string().optional(),
  fromEntityId: z.string().optional(),
  toEntityType: z.string().optional(),
  toEntityId: z.string().optional(),
  edgeType: z.string().optional(),
  weight: z.number().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }

  const body = indexSchema.parse(await req.json());

  if (body.action === "index") {
    if (!body.entityType || !body.entityId || !body.title) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "entityType, entityId, and title are required for index action" } },
        { status: 400 },
      );
    }
    await indexEntity({
      entityType: body.entityType as DiscoveryEntityType,
      entityId: body.entityId,
      title: body.title,
      description: body.description,
      language: body.language,
      subject: body.subject,
      grade: body.grade,
      difficulty: body.difficulty,
      resourceType: body.resourceType,
      tags: body.tags,
      ownerId: body.ownerId,
      orgId: body.orgId,
      price: body.price,
      isMarketplace: body.isMarketplace,
      isAiGenerated: body.isAiGenerated,
      isVerified: body.isVerified,
      popularity: body.popularity,
      quality: body.quality,
    });
    return NextResponse.json({ success: true, action: "index" });
  }

  if (body.action === "link") {
    if (!body.fromEntityType || !body.fromEntityId || !body.toEntityType || !body.toEntityId || !body.edgeType) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "fromEntityType, fromEntityId, toEntityType, toEntityId, and edgeType are required for link action" } },
        { status: 400 },
      );
    }
    await linkEntities({
      fromEntityType: body.fromEntityType as DiscoveryEntityType,
      fromEntityId: body.fromEntityId,
      toEntityType: body.toEntityType as DiscoveryEntityType,
      toEntityId: body.toEntityId,
      edgeType: body.edgeType as EdgeType,
      weight: body.weight,
    });
    return NextResponse.json({ success: true, action: "link" });
  }

  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action" } }, { status: 400 });
});
