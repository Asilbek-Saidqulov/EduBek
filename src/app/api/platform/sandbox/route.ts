/** POST /api/platform/sandbox — Execute code in sandbox */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { executeInSandbox, listSandboxes } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({
  installId: z.string().min(1), code: z.string(),
  input: z.record(z.string(), z.unknown()).optional(), timeoutMs: z.number().int().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await executeInSandbox(body);
  return NextResponse.json(result, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const sandboxes = await listSandboxes({
    extensionInstallId: url.searchParams.get("extensionInstallId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ sandboxes, total: sandboxes.length });
});
