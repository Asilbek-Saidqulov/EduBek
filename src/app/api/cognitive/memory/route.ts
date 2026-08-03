/**
 * GET /api/cognitive/memory — List memory entries (working / episodic / semantic)
 * POST /api/cognitive/memory — Record an episodic or semantic memory entry
 *
 * Query params (GET):
 *   - level (working | episodic | semantic, default semantic)
 *   - domain (optional, for semantic)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getWorkingMemory, listEpisodes, listKnowledge,
  recordEpisode, recordKnowledge,
} from "@/features/cognitive-ai";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const level = url.searchParams.get("level") ?? "semantic";
  const domain = url.searchParams.get("domain") ?? undefined;
  if (level === "working") {
    const entries = await getWorkingMemory("session", ctx.userId);
    return NextResponse.json({ entries });
  }
  if (level === "episodic") {
    const entries = await listEpisodes("user", ctx.userId);
    return NextResponse.json({ entries });
  }
  // semantic
  const entries = await listKnowledge(domain);
  return NextResponse.json({ entries });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { level } = body as Record<string, unknown>;
  if (level === "episodic") {
    const { kind, summary, importance, tags, payload } = body as Record<string, unknown>;
    if (!kind || !summary) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "kind and summary are required for episodic memory" } }, { status: 400 });
    }
    const entry = await recordEpisode({
      scopeType: "user", scopeId: ctx.userId,
      kind: kind as "teacher_action" | "student_milestone" | "organization_decision" | "ai_intervention" | "workflow_execution",
      summary: String(summary),
      importance: typeof importance === "number" ? importance : undefined,
      tags: Array.isArray(tags) ? tags as string[] : undefined,
      payload: payload as Record<string, unknown> | undefined,
    });
    return NextResponse.json(entry, { status: 201 });
  }
  if (level === "semantic") {
    const { domain, kind, statement, explanation, source, confidence, tags } = body as Record<string, unknown>;
    if (!domain || !kind || !statement || !source) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "domain, kind, statement, and source are required for semantic memory" } }, { status: 400 });
    }
    const entry = await recordKnowledge({
      domain: String(domain), kind: String(kind),
      statement: String(statement),
      explanation: explanation ? String(explanation) : undefined,
      source: String(source),
      confidence: typeof confidence === "number" ? confidence : undefined,
      tags: Array.isArray(tags) ? tags as string[] : undefined,
    });
    return NextResponse.json(entry, { status: 201 });
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "level must be 'episodic' or 'semantic'" } }, { status: 400 });
});
