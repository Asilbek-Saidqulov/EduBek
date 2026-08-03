/** GET+POST /api/intelligence-network/equivalences — List/create curriculum equivalences */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listEquivalences, createEquivalence, findEquivalentStandards } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "find_equivalents") {
    const framework = url.searchParams.get("framework")!;
    const standardCode = url.searchParams.get("standardCode")!;
    const results = await findEquivalentStandards(framework, standardCode);
    return NextResponse.json({ equivalents: results, total: results.length });
  }
  const equivalences = await listEquivalences({
    sourceFramework: url.searchParams.get("sourceFramework") ?? undefined,
    targetFramework: url.searchParams.get("targetFramework") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ equivalences, total: equivalences.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const eq = await createEquivalence(body);
  return NextResponse.json(eq, { status: 201 });
});
