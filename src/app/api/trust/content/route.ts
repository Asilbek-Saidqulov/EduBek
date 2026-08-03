/** GET/POST /api/trust/content — Content moderation metadata */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listContentRecords, registerContentRecord, classifyContent, removeContent, restoreContent, supportsAllContentClassifications, supportsAllContentStatuses } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const classification = searchParams.get("classification") as any;
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    records: listContentRecords(classification ?? undefined, status ?? undefined),
    classifications: supportsAllContentClassifications(), statuses: supportsAllContentStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "classify") return NextResponse.json({ record: classifyContent(body.id, body.classification, ctx.userId) });
  if (body.action === "remove") return NextResponse.json({ record: removeContent(body.id, ctx.userId, body.reason) });
  if (body.action === "restore") return NextResponse.json({ record: restoreContent(body.id, ctx.userId, body.reason) });
  const record = registerContentRecord(body);
  return NextResponse.json({ record }, { status: 201 });
});
