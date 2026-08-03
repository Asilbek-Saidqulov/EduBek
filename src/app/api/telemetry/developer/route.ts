/** GET /api/telemetry/developer — Developer integration metadata */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getDeveloperIntegration, generateMarkdownDocumentation } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("format") === "markdown") {
    return new NextResponse(generateMarkdownDocumentation(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
  }
  return NextResponse.json(getDeveloperIntegration());
});
