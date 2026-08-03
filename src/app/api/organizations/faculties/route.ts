/** GET /api/organizations/faculties — List faculties */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listFaculties } from "@/features/organization-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({ route: "faculties", data: listFaculties() });
});
