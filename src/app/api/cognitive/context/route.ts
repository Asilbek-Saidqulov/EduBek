/**
 * GET /api/cognitive/context — Get a cognitive context snapshot
 *
 * Query params:
 *   - conversationId (optional)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getWorkingMemory, listGoals, listReflections, getActiveConversation } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const [workingMemory, goals, reflections, conversation] = await Promise.all([
    getWorkingMemory("session", ctx.userId),
    listGoals("active"),
    listReflections(5),
    getActiveConversation(ctx.userId),
  ]);
  return NextResponse.json({
    traceId: crypto.randomUUID(),
    workingMemory,
    activeGoals: goals,
    currentPlan: null,
    recentReflections: reflections,
    conversationState: conversation,
    assembledAt: new Date().toISOString(),
  });
});
