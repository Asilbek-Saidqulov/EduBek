/** GET /api/standards/:id — Get a single standard with its mappings */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getStandard, listMappings } from "@/features/knowledge-intelligence";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const standard = await getStandard(id);
  if (!standard) throw notFound("Standard not found");
  const mappings = await listMappings({ standardId: id, limit: 100 });
  return NextResponse.json({ ...standard, mappings });
});
