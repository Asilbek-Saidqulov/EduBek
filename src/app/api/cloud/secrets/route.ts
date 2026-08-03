/** GET+POST /api/cloud/secrets — List/store secrets; POST :id?action=rotate — Rotate */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSecrets, storeSecret, getSecretValue, rotateSecret, findSecretsDueForRotation } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1), name: z.string().min(1), value: z.string().min(1),
  organizationId: z.string().optional(),
  rotationEnabled: z.boolean().default(false), rotationDays: z.number().int().min(1).max(365).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "due_for_rotation") {
    const secrets = await findSecretsDueForRotation();
    return NextResponse.json({ secrets, total: secrets.length });
  }
  const secrets = await listSecrets({
    type: url.searchParams.get("type") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ secrets, total: secrets.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const secret = await storeSecret({ ...body, createdBy: ctx.userId });
  return NextResponse.json(secret, { status: 201 });
});
