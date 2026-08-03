/** GET+POST /api/studio/experiences — List/create learning experiences */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listExperiences, createExperience, publishExperience } from "@/features/learning-studio";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1), title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(), subject: z.string().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  aiGenerated: z.boolean().default(false), aiModel: z.string().optional(),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).default([]), difficulty: z.string().default("medium"),
  estimatedMinutes: z.number().int().min(1).max(480).default(15),
  isMarketplace: z.boolean().default(false), priceEduTokens: z.number().int().min(0).default(0),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const experiences = await listExperiences({
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? "published",
    authorId: url.searchParams.get("authorId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    subject: url.searchParams.get("subject") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ experiences, total: experiences.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const experience = await createExperience({ ...body, authorId: ctx.userId, authorName: ctx.email ?? ctx.userId });
  return NextResponse.json(experience, { status: 201 });
});
