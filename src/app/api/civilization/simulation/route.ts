/** GET+POST /api/civilization/simulation — List/run institutional simulations */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSimulations, runSimulation } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const sims = await listSimulations({ organizationId: url.searchParams.get("organizationId")!, type: url.searchParams.get("type") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 50) });
  return NextResponse.json({ simulations: sims, total: sims.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const sim = await runSimulation({ ...body, createdBy: ctx.userId });
  return NextResponse.json(sim, { status: 201 });
});
