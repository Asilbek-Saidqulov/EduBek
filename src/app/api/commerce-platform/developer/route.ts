/** GET /api/commerce-platform/developer — Developer integration metadata (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getDeveloperIntegration, generateMarkdownDocumentation } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("format") === "markdown") {
    return new NextResponse(generateMarkdownDocumentation(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
  }
  return NextResponse.json(getDeveloperIntegration());
});
