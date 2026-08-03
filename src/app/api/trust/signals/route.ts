/** GET/POST /api/trust/signals — Safety signals */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSignals, ingestSignal, createInvestigationFromSignal, dismissSignal, supportsAllSignalTypes, supportsAllSignalStatuses } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  return NextResponse.json({
    signals: listSignals(status ?? undefined, type ?? undefined),
    types: supportsAllSignalTypes(), statuses: supportsAllSignalStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "investigate") return NextResponse.json({ signal: createInvestigationFromSignal(body.id) });
  if (body.action === "dismiss") return NextResponse.json({ signal: dismissSignal(body.id, body.reason) });
  const signal = ingestSignal(body);
  return NextResponse.json({ signal }, { status: 201 });
});
