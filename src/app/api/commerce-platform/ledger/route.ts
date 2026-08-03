/** GET /api/commerce-platform/ledger — Transaction ledger (read-only, immutable) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listLedgerEntries, listLedgerByReference, getLedgerEntryCount, verifyLedgerIntegrity } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const reference = searchParams.get("reference");
  const entries = reference ? listLedgerByReference(reference) : listLedgerEntries(limit, offset);
  return NextResponse.json({
    entries,
    totalCount: getLedgerEntryCount(),
    integrity: verifyLedgerIntegrity(),
  });
});
