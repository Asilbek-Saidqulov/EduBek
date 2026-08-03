/**
 * GET  /api/education-os/memory — List memories (filter by scopeType/scopeId/type)
 * POST /api/education-os/memory — Store a new memory
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  recallAgentMemory,
  storeAgentMemory,
  getAgentMemory,
  deleteAgentMemory,
  pruneMemory,
} from "@/features/education-os";
import { z } from "zod";

const postSchema = z.object({
  scopeType: z.enum(["user", "classroom", "organization", "system"]),
  scopeId: z.string().min(1),
  type: z.enum(["conversation", "goal", "action", "context", "workflow"]),
  summary: z.string().min(1).max(2000),
  payload: z.record(z.string(), z.unknown()).optional(),
  importance: z.number().min(0).max(1).default(0.5),
  agentType: z.enum([
    "teacher", "student", "curriculum", "assessment", "organization",
    "marketplace", "planner", "notification", "analytics",
  ]).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
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

  // Special actions
  if (url.searchParams.get("action") === "prune") {
    const deleted = await pruneMemory();
    return NextResponse.json({ success: true, deleted });
  }
  const id = url.searchParams.get("id");
  if (id) {
    const memory = await getAgentMemory(id);
    if (!memory) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Memory not found" } },
        { status: 404 },
      );
    }
    return NextResponse.json(memory);
  }

  const memories = await recallAgentMemory({
    scopeType: (url.searchParams.get("scopeType") ?? "user") as any,
    scopeId: url.searchParams.get("scopeId") ?? ctx.userId,
    type: url.searchParams.get("type") as any,
    agentType: url.searchParams.get("agentType") as any,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ memories, total: memories.length });
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
  const memory = await storeAgentMemory(body);
  return NextResponse.json(memory, { status: 201 });
});

export const DELETE = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "id query parameter required" } },
      { status: 400 },
    );
  }
  await deleteAgentMemory(id);
  return NextResponse.json({ success: true });
});
