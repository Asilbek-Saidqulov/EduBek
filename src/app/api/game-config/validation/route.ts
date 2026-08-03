/** GET /api/game-config/validation — Config validation (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getValidationResultFor } from "@/features/game-config";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const configId = searchParams.get('configId'); const version = searchParams.get('version') ?? ''; return NextResponse.json({ result: configId ? getValidationResultFor(configId, version) : null });
});
