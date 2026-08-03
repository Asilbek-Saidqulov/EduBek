/** GET+POST /api/studio/worlds — List/generate learning worlds */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listLearningWorlds, generateLearningWorld } from "@/features/learning-studio";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const worlds = await listLearningWorlds({
    theme: url.searchParams.get("theme") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ worlds, total: worlds.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const world = await generateLearningWorld(body);
  return NextResponse.json(world, { status: 201 });
});
