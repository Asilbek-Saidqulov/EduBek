/**
 * POST /api/analysis/entity — Full entity analysis pipeline
 *
 * Runs concept extraction + curriculum mapping + quality analysis +
 * auto-relationships in one call. Used by resource creation / update
 * flows to enrich the entity with educational metadata.
 *
 * Body: { entityType, entityId, title, content, subject?, frameworkIds? }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { analyzeEntity } from "@/features/knowledge-intelligence";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1).max(300),
  content: z.string(),
  subject: z.string().max(100).optional(),
  frameworkIds: z.array(z.string()).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = schema.parse(await req.json());
  const result = await analyzeEntity(body);
  return NextResponse.json(result, { status: 201 });
});
