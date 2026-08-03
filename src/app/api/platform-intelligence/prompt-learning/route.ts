/**
 * GET  /api/platform-intelligence/prompt-learning — Prompt learning analytics
 * POST /api/platform-intelligence/prompt-learning — Record a prompt evaluation
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPromptLearning, recordPromptEval } from "@/features/platform-intelligence";
import { z } from "zod";

const getSchema = z.object({
  sinceDays: z.coerce.number().int().min(1).max(365).default(30),
});

const postSchema = z.object({
  promptTemplateId: z.string().optional(),
  promptVersion: z.string().optional(),
  provider: z.string().min(1),
  model: z.string().min(1),
  generationId: z.string().optional(),
  acceptanceScore: z.number().min(0).max(1).optional(),
  regenerationRate: z.number().min(0).max(1).optional(),
  editRate: z.number().min(0).max(1).optional(),
  userRating: z.number().min(0).max(1).optional(),
  costCredits: z.number().int().min(0).optional(),
  latencyMs: z.number().int().min(0).optional(),
  locale: z.string().optional(),
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
  const { sinceDays } = getSchema.parse(params);
  const learning = await getPromptLearning({ sinceDays });
  return NextResponse.json({ prompts: learning, total: learning.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = postSchema.parse(await req.json());
  await recordPromptEval(body);
  return NextResponse.json({ success: true }, { status: 201 });
});
