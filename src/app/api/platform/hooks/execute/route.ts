/** POST /api/platform/hooks/execute — Execute hooks for an event */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { executeHooks } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({ event: z.string().min(1), payload: z.record(z.string(), z.unknown()).default({}) });

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await executeHooks(body.event, body.payload);
  return NextResponse.json(result);
});
