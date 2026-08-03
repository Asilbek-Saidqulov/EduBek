/** GET/POST /api/telemetry/errors — Error registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listErrors, registerError, recordErrorOccurrence, supportsAllErrorCategories, supportsAllErrorSeverities } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as any;
  const severity = searchParams.get("severity") as any;
  return NextResponse.json({
    errors: listErrors(category ?? undefined, severity ?? undefined),
    categories: supportsAllErrorCategories(), severities: supportsAllErrorSeverities(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "record_occurrence") return NextResponse.json({ error: recordErrorOccurrence(body.code) });
  const error = registerError(body);
  return NextResponse.json({ error }, { status: 201 });
});
