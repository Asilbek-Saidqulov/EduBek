/** GET/POST /api/telemetry/snapshots — Snapshot platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPlatformSnapshots, takePlatformSnapshot, getLatestSnapshot } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({ snapshots: listPlatformSnapshots(), latest: getLatestSnapshot() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const snap = takePlatformSnapshot(body ?? {});
  return NextResponse.json({ snapshot: snap }, { status: 201 });
});
