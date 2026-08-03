/**
 * GET  /api/digital-twins/memory — List academic memories
 * POST /api/digital-twins/memory — Store an academic memory
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { recallAcademicMemory, storeAcademicMemory } from "@/features/digital-twins";
import { z } from "zod";

const postSchema = z.object({
  scopeType: z.enum(["student", "teacher", "classroom", "organization"]),
  scopeId: z.string().min(1),
  academicYear: z.string().min(1),
  type: z.enum(["enrollment", "curriculum_history", "intervention", "achievement", "trajectory", "teacher_assignment", "class_composition"]),
  summary: z.string().min(1).max(2000),
  payload: z.record(z.string(), z.unknown()).optional(),
  importance: z.number().min(0).max(1).default(0.5),
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
  const memories = await recallAcademicMemory({
    scopeType: url.searchParams.get("scopeType") as any ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    academicYear: url.searchParams.get("academicYear") ?? undefined,
    type: url.searchParams.get("type") as any ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
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
  const memory = await storeAcademicMemory(body);
  return NextResponse.json(memory, { status: 201 });
});
