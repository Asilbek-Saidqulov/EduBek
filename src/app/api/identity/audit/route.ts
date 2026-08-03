/** GET /api/identity/audit — Identity audit log (immutable) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAuditEntries, getAuditEntryCount, verifyAuditIntegrity } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const identityId = searchParams.get("identityId") ?? undefined;
  return NextResponse.json({
    entries: listAuditEntries(limit, offset, identityId),
    totalCount: getAuditEntryCount(),
    integrity: verifyAuditIntegrity(),
  });
});
