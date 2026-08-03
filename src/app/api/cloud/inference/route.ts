/** GET /api/cloud/inference — List; POST — Request inference */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listInferences, requestInference } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  provider: z.string().optional(), model: z.string().optional(),
  requestType: z.string().default("chat"),
  input: z.record(z.string(), z.unknown()),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const inferences = await listInferences({
    provider: url.searchParams.get("provider") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    userId: ctx.userId,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ inferences, total: inferences.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await requestInference({ ...body, userId: ctx.userId });
  return NextResponse.json(result, { status: 201 });
});
