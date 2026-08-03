/** GET+POST /api/research/datasets — List/create datasets; POST ?action=validate — Validate FAIR compliance */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listDatasets, createDataset, validateDatasetFairness } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const datasets = await listDatasets({
    projectId: url.searchParams.get("projectId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ datasets, total: datasets.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "validate") {
    const body = await req.json();
    const result = await validateDatasetFairness(body.id);
    return NextResponse.json(result);
  }
  const body = await req.json();
  const dataset = await createDataset(body);
  return NextResponse.json(dataset, { status: 201 });
});
