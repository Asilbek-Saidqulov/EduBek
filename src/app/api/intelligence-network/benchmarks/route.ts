/** GET+POST /api/intelligence-network/benchmarks — List/record global benchmarks */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listBenchmarks, recordBenchmark } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const benchmarks = await listBenchmarks({
    metric: url.searchParams.get("metric") ?? undefined,
    scope: url.searchParams.get("scope") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ benchmarks, total: benchmarks.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const bm = await recordBenchmark(body);
  return NextResponse.json(bm, { status: 201 });
});
