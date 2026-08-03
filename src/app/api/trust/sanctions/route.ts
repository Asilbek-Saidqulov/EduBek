/** GET/POST/PUT /api/trust/sanctions — Sanction platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSanctions, createSanction, approveSanction, revokeSanction, supportsAllSanctionTypes, supportsAllSanctionStatuses } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  return NextResponse.json({
    sanctions: listSanctions(status ?? undefined, type ?? undefined),
    types: supportsAllSanctionTypes(), statuses: supportsAllSanctionStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const sanction = createSanction({ ...body, issuedBy: body.issuedBy ?? ctx.userId });
  return NextResponse.json({ sanction }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let sanction = null;
  if (body.action === "approve") sanction = approveSanction(body.id, ctx.userId);
  else if (body.action === "revoke") sanction = revokeSanction(body.id, ctx.userId, body.reason);
  return NextResponse.json({ sanction });
});
