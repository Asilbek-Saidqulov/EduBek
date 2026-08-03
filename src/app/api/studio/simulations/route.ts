/** GET+POST /api/studio/simulations — List/generate simulations */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSimulations, generateSimulation } from "@/features/learning-studio";
import { z } from "zod";

const schema = z.object({
  domain: z.string().min(1), name: z.string().min(1), experienceId: z.string().optional(),
  parameters: z.array(z.record(z.string(), z.unknown())).optional(),
  equations: z.array(z.record(z.string(), z.unknown())).optional(),
  assessment: z.array(z.record(z.string(), z.unknown())).optional(),
  safetyNotes: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const simulations = await listSimulations({
    domain: url.searchParams.get("domain") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ simulations, total: simulations.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const simulation = await generateSimulation(body as any);
  return NextResponse.json(simulation, { status: 201 });
});
