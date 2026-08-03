/** GET+POST /api/intelligence-network/api-calls — List/make Foundation API calls */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listApiCalls, callFoundationApi } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const calls = await listApiCalls({
    endpoint: url.searchParams.get("endpoint") ?? undefined,
    callerId: url.searchParams.get("callerId") ?? ctx.userId,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ calls, total: calls.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const call = await callFoundationApi({ ...body, callerId: ctx.userId });
  return NextResponse.json(call, { status: 201 });
});
