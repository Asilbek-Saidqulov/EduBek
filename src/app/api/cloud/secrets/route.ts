/** GET+POST /api/cloud/secrets — List/store secrets
 *
 * SECURITY:
 *   - All endpoints require authentication.
 *   - All endpoints require CLOUD_SECRET_MANAGE permission (admin role) —
 *     secrets stored here include OAuth client secrets, payment provider
 *     keys, and other high-value credentials.
 *   - `createdBy` is ALWAYS derived from ctx.userId, never from the body.
 *   - GET never returns the encryptedValue (metadata only).
 */
import { NextResponse } from "next/server";
import { withErrorHandler, forbidden, unauthorized } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSecrets, storeSecret, findSecretsDueForRotation } from "@/features/cloud-infra";
import { can, PlatformPermission } from "@/features/rbac";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  value: z.string().min(1).max(10000),
  organizationId: z.string().optional(),
  rotationEnabled: z.boolean().default(false),
  rotationDays: z.number().int().min(1).max(365).optional(),
});

function requireSecretManage(ctx: { userId?: string; isSuperadmin: boolean; platformRoles: string[] }) {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx as any, PlatformPermission.CLOUD_SECRET_MANAGE) && !ctx.isSuperadmin) {
    throw forbidden("Cloud secret management permission required");
  }
}

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  requireSecretManage(ctx);
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
  // NEVER return the encryptedValue to the client — only metadata.
  const safe = secrets.map((s: any) => ({
    id: s.id, type: s.type, name: s.name,
    organizationId: s.organizationId,
    rotationEnabled: s.rotationEnabled, rotationDays: s.rotationDays,
    nextRotationAt: s.nextRotationAt, createdAt: s.createdAt,
  }));
  return NextResponse.json({ secrets: safe, total: safe.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  requireSecretManage(ctx);
  const body = schema.parse(await req.json().catch(() => null));
  const secret = await storeSecret({ ...body, createdBy: ctx.userId });
  // Don't return the encrypted value — only metadata.
  return NextResponse.json({
    id: secret.id, type: secret.type, name: secret.name,
    organizationId: secret.organizationId,
    rotationEnabled: secret.rotationEnabled, rotationDays: secret.rotationDays,
    nextRotationAt: secret.nextRotationAt, createdAt: secret.createdAt,
  }, { status: 201 });
});
