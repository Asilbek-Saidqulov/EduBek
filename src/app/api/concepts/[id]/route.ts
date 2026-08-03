/** GET /api/concepts/:id — Get a single concept by ID */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getConcept } from "@/features/knowledge-intelligence";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const concept = await getConcept(id);
  if (!concept) throw notFound("Concept not found");
  return NextResponse.json(concept);
});
