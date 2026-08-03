/** GET+POST /api/studio/artifacts — List/generate content artifacts */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listContentArtifacts, generateContentArtifact } from "@/features/learning-studio";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const artifacts = await listContentArtifacts({
    type: url.searchParams.get("type") ?? undefined,
    subject: url.searchParams.get("subject") ?? undefined,
    topic: url.searchParams.get("topic") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ artifacts, total: artifacts.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const artifact = await generateContentArtifact(body);
  return NextResponse.json(artifact, { status: 201 });
});
