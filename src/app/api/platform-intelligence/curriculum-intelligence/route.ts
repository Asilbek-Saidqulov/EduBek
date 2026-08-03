/** GET /api/platform-intelligence/curriculum-intelligence — Curriculum intelligence dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCurriculumIntelligence } from "@/features/platform-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const frameworkId = url.searchParams.get("frameworkId") ?? undefined;
  const intelligence = await getCurriculumIntelligence({ frameworkId });
  return NextResponse.json(intelligence);
});
