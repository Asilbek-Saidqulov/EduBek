/** GET /api/extension-framework/documentation — Get documentation */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateDocumentation } from "@/features/extension-framework";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({ route: "documentation", data: generateDocumentation() });
});
