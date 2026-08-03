/** GET /api/concepts/search?q=... — Search concepts by name/description/alias */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { searchConcepts } from "@/features/knowledge-intelligence";
import { z } from "zod";

const schema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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
  const params = Object.fromEntries(url.searchParams);
  const { q, limit } = schema.parse(params);
  const concepts = await searchConcepts(q, limit);
  return NextResponse.json({ concepts, total: concepts.length });
});
