/** GET /api/event-governance/documentation — Event governance documentation (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateGovernanceDocumentation, generateMarkdownDocumentation, generateJsonDocumentation } from "@/features/event-governance-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format'); if (format === 'markdown') { return new NextResponse(generateMarkdownDocumentation(), { headers: { 'Content-Type': 'text/markdown' } }); } if (format === 'json') { return new NextResponse(generateJsonDocumentation(), { headers: { 'Content-Type': 'application/json' } }); } return NextResponse.json(generateGovernanceDocumentation());
});
