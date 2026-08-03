/**
 * GET /api/product/memory — List memory entries (optionally filter by category)
 * POST /api/product/memory — Set a memory entry
 * DELETE /api/product/memory — Delete a memory entry
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listMemory, setMemory, deleteMemory, getMemoryReport,
  addFavoriteView, removeFavoriteView, hideWidget, showWidget,
  setDashboardLayout, setPreferredAIStyle, recordVisitedPage,
} from "@/features/product-intelligence";
import type { ProductMemoryEntry } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const report = url.searchParams.get("report") === "true";
  if (report) {
    const r = await getMemoryReport(ctx.userId);
    return NextResponse.json(r);
  }
  const entries = await listMemory(ctx.userId, category);
  return NextResponse.json({ entries });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { action, key, value, category } = body as Record<string, unknown>;
  // Convenience actions
  if (action === "add_favorite_view" && key) { await addFavoriteView(ctx.userId, String(key)); return NextResponse.json({ ok: true }); }
  if (action === "remove_favorite_view" && key) { await removeFavoriteView(ctx.userId, String(key)); return NextResponse.json({ ok: true }); }
  if (action === "hide_widget" && key) { await hideWidget(ctx.userId, String(key)); return NextResponse.json({ ok: true }); }
  if (action === "show_widget" && key) { await showWidget(ctx.userId, String(key)); return NextResponse.json({ ok: true }); }
  if (action === "set_dashboard_layout" && value) { await setDashboardLayout(ctx.userId, value as Record<string, unknown>); return NextResponse.json({ ok: true }); }
  if (action === "set_preferred_ai_style" && key) { await setPreferredAIStyle(ctx.userId, String(key)); return NextResponse.json({ ok: true }); }
  if (action === "record_visited_page" && key) { await recordVisitedPage(ctx.userId, String(key)); return NextResponse.json({ ok: true }); }
  // Generic set
  if (!key) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "key is required" } }, { status: 400 });
  }
  await setMemory(ctx.userId, String(key), value, (category as ProductMemoryEntry["category"]) ?? "preference");
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "key is required" } }, { status: 400 });
  }
  await deleteMemory(ctx.userId, key);
  return NextResponse.json({ ok: true });
});
