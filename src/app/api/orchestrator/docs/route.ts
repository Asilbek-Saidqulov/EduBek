/**
 * GET /api/orchestrator/docs — Auto-generated platform documentation.
 *
 * Returns sections covering architecture, API, workflows, events,
 * knowledge graph, dependency graph, prompts, agents, extensions,
 * database, integrations, localization, and coverage.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateDocumentation } from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const docs = await generateDocumentation();
  return NextResponse.json(docs);
});
