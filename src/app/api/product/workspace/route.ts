/**
 * GET /api/product/workspace — List workspaces (optionally filter by kind)
 * POST /api/product/workspace — Create a new workspace
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createWorkspace, listWorkspaces, getActiveWorkspace,
} from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? undefined;
  const [workspaces, active] = await Promise.all([
    listWorkspaces(ctx.userId, kind),
    getActiveWorkspace(ctx.userId),
  ]);
  return NextResponse.json({ workspaces, active });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { kind, title, draft, tabs } = body as Record<string, unknown>;
  if (!kind || !title) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "kind and title are required" } }, { status: 400 });
  }
  const workspace = await createWorkspace({
    userId: ctx.userId,
    kind: String(kind),
    title: String(title),
    draft: draft as Record<string, unknown> | undefined,
    tabs: tabs as never | undefined,
  });
  return NextResponse.json(workspace, { status: 201 });
});
