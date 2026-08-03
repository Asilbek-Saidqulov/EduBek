/** GET /api/developer/documentation — Generate documentation for an extension (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateDocumentation } from "@/features/developer-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const extensionId = url.searchParams.get("extensionId");
  if (!extensionId) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "extensionId is required" } }, { status: 400 });
  }
  const docs = await generateDocumentation(extensionId);
  return NextResponse.json(docs);
});
