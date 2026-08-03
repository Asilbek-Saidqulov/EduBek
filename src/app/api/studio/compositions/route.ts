/** GET+POST /api/studio/compositions — List/create experience compositions */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCompositions, composeExperience, publishComposition } from "@/features/learning-studio";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(300), description: z.string().max(2000).optional(),
  components: z.array(z.object({
    type: z.string().min(1), experienceId: z.string().min(1),
    order: z.number().int().min(1), config: z.record(z.string(), z.unknown()).default({}),
  })),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).default([]), estimatedMinutes: z.number().int().min(1).max(480).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const compositions = await listCompositions({
    authorId: url.searchParams.get("authorId") ?? ctx.userId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ compositions, total: compositions.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "publish") {
    const body = await req.json();
    const comp = await publishComposition(body.id);
    return NextResponse.json(comp);
  }
  const body = schema.parse(await req.json());
  const comp = await composeExperience({ ...body, authorId: ctx.userId, authorName: ctx.email ?? ctx.userId });
  return NextResponse.json(comp, { status: 201 });
});
