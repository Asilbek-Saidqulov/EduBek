/** GET+POST /api/cloud/media — List/submit media jobs */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMediaJobs, submitMediaJob } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  mediaType: z.enum(["video", "audio", "image", "presentation", "whiteboard"]),
  operation: z.enum(["transcription", "ocr", "thumbnail", "subtitle", "compression", "format_conversion"]),
  inputUrl: z.string().min(1), organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const jobs = await listMediaJobs({
    status: url.searchParams.get("status") ?? undefined,
    mediaType: url.searchParams.get("mediaType") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ jobs, total: jobs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const job = await submitMediaJob(body);
  return NextResponse.json(job, { status: 201 });
});
