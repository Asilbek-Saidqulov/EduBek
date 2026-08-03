/** GET+POST /api/intelligence-network/synthetic — List/generate synthetic datasets */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSyntheticDatasets, generateSyntheticDataset } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const datasets = await listSyntheticDatasets({
    purpose: url.searchParams.get("purpose") ?? undefined,
    domain: url.searchParams.get("domain") ?? undefined,
    privacyLevel: url.searchParams.get("privacyLevel") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ datasets, total: datasets.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const ds = await generateSyntheticDataset(body);
  return NextResponse.json(ds, { status: 201 });
});
