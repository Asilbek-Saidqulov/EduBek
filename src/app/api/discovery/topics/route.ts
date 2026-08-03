/**
 * GET /api/discovery/topics
 *
 * Phase 4F.1: Browse the topic tree.
 *
 * Query params:
 *   parentId=abc123  — get children of a specific topic (omit for root topics)
 *   topicId=abc123   — get a specific topic with its tree
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTopics, getTopicTree } from "@/features/discovery";
import { z } from "zod";

const schema = z.object({
  parentId: z.string().optional(),
  topicId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  await getAuthContext();
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { parentId, topicId } = schema.parse(params);

  if (topicId) {
    const topic = await getTopicTree(topicId);
    return NextResponse.json(topic);
  }

  const topics = await getTopics(parentId ?? null);
  return NextResponse.json({ topics });
});
