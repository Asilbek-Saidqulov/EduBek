/** GET+POST /api/intelligence-network/observatory — List/capture global observatory snapshots */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listObservatories, captureObservatory, getLatestObservatory } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("latest") === "true") {
    const obs = await getLatestObservatory();
    return NextResponse.json(obs);
  }
  const observatories = await listObservatories({ limit: Number(url.searchParams.get("limit") ?? 30) });
  return NextResponse.json({ observatories, total: observatories.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const obs = await captureObservatory(body);
  return NextResponse.json(obs, { status: 201 });
});
