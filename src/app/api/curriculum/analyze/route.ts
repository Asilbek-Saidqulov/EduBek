/** POST /api/curriculum/analyze — Auto-map an entity to curriculum standards using AI */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { autoMapEntityToStandards } from "@/features/knowledge-intelligence";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1).max(300),
  content: z.string(),
  subject: z.string().max(100).optional(),
  frameworkIds: z.array(z.string()).optional(),
  threshold: z.number().min(0).max(1).default(0.4),
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
  const mappings = await autoMapEntityToStandards(body);
  return NextResponse.json({ mappings, total: mappings.length });
});
