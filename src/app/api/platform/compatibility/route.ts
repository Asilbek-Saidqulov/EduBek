/**
 * GET  /api/platform/compatibility — List compatibility entries
 * POST /api/platform/compatibility — Check compatibility
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCompatibilityEntries, checkCompatibility } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({
  extensionId: z.string().min(1), extensionVersion: z.string().min(1),
  platformVersion: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const entries = await listCompatibilityEntries({
    extensionId: url.searchParams.get("extensionId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 500),
  });
  return NextResponse.json({ entries, total: entries.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await checkCompatibility(body);
  return NextResponse.json(result, { status: 201 });
});
