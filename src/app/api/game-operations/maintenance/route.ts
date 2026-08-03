/** GET /api/game-operations/maintenance — Operations maintenance (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMaintenance } from "@/features/game-operations";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); return NextResponse.json({ maintenance: listMaintenance(status as never) });
});
