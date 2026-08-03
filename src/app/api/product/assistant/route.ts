/**
 * GET /api/product/assistant — List available agents
 * POST /api/product/assistant — Chat with the assistant
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAgents, chatWithAssistant } from "@/features/product-intelligence";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  return NextResponse.json({ agents: listAgents() });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { query, organizationId, classroomId } = body as Record<string, unknown>;
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "query is required" } }, { status: 400 });
  }
  const response = await chatWithAssistant({
    ctx,
    organizationId: organizationId ? String(organizationId) : null,
    classroomId: classroomId ? String(classroomId) : null,
    query,
  });
  return NextResponse.json(response);
});
