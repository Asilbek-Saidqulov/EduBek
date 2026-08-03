/** POST /api/research/assistant — Query the AI Research Assistant */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { queryResearchAssistant } from "@/features/research-platform";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(1).max(2000),
  projectId: z.string().optional(),
  organizationId: z.string().optional(),
  locale: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await queryResearchAssistant({ ...body, locale: body.locale ?? ctx.locale ?? "en" });
  return NextResponse.json(result, { status: 201 });
});
