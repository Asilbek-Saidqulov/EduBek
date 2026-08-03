/** GET /api/frameworks/:id — Get a single framework with its standards */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getFramework, listStandards } from "@/features/knowledge-intelligence";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const framework = await getFramework(id);
  if (!framework) throw notFound("Framework not found");
  const url = new URL(req.url);
  const standards = await listStandards({
    frameworkId: id,
    subject: url.searchParams.get("subject") ?? undefined,
    grade: url.searchParams.get("grade") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 200),
  });
  return NextResponse.json({ ...framework, standards });
});
