/** GET/POST /api/commerce-platform/licenses — License catalog (read + issue) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listLicenses, issueLicense, supportsAllLicenseTypes, supportsAllLicenseStatuses } from "@/features/commerce-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  return NextResponse.json({ licenses: listLicenses(status ?? undefined, type ?? undefined), types: supportsAllLicenseTypes(), statuses: supportsAllLicenseStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const license = issueLicense(body);
  return NextResponse.json({ license }, { status: 201 });
});
