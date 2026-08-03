/** GET+POST /api/cloud/workers — List/register workers; POST ?action=heartbeat — Heartbeat */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWorkers, registerWorker, heartbeat } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["cpu", "gpu", "media", "documents"]), name: z.string().min(1),
  capabilities: z.array(z.string()).optional(), resources: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const workers = await listWorkers({
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ workers, total: workers.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "heartbeat") {
    const body = await req.json();
    await heartbeat(body.workerId, body.load ?? {});
    return NextResponse.json({ success: true });
  }
  const body = schema.parse(await req.json());
  const worker = await registerWorker(body);
  return NextResponse.json(worker, { status: 201 });
});
