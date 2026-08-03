/**
 * POST /api/education-os/execute — Execute a task via the coordinator
 *
 * Body: {
 *   instruction: string,
 *   task?: { code, params, locale? },  // optional structured task
 *   scopeType?: 'user' | 'classroom' | 'organization' | 'system',
 *   scopeId?: string,
 *   locale?: string
 * }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { execute } from "@/features/education-os";
import { z } from "zod";

const schema = z.object({
  instruction: z.string().min(1).max(2000),
  task: z.object({
    code: z.string().min(1),
    params: z.record(z.string(), z.unknown()).default({}),
    locale: z.string().optional(),
  }).optional(),
  scopeType: z.enum(["user", "classroom", "organization", "system"]).default("system"),
  scopeId: z.string().default("coordinator"),
  locale: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = schema.parse(await req.json());
  // Override scopeId with the user's ID if scopeType is 'user' and no explicit scopeId
  const scopeId = body.scopeType === "user" && body.scopeId === "coordinator"
    ? ctx.userId
    : body.scopeId;
  const result = await execute({
    instruction: body.instruction,
    task: body.task,
    scopeType: body.scopeType,
    scopeId,
    locale: body.locale ?? ctx.locale ?? "en",
  });
  return NextResponse.json(result);
});
