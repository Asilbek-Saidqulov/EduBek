/**
 * GET  /api/concepts — List concepts (filter by subject/bloomLevel/language)
 * POST /api/concepts — Create a concept manually
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listConcepts, getConcept } from "@/features/knowledge-intelligence";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  subject: z.string().max(100).optional(),
  bloomLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
  difficulty: z.number().min(0).max(1).default(0.5),
  estimatedMinutes: z.number().int().min(1).max(480).default(30),
  language: z.string().min(2).max(5).default("en"),
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
  const concepts = await listConcepts({
    subject: url.searchParams.get("subject") ?? undefined,
    bloomLevel: url.searchParams.get("bloomLevel") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
    offset: Number(url.searchParams.get("offset") ?? 0),
  });
  return NextResponse.json({ concepts, total: concepts.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = createSchema.parse(await req.json());
  const slug = body.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
  const concept = await db.concept.create({
    data: { ...body, slug, aiConfidence: 0.5 },
  });
  return NextResponse.json(concept, { status: 201 });
});
