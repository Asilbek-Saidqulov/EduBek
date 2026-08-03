/** GET+POST /api/cloud/cache — Cache get/set; DELETE — Cache delete */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { cacheGet, cacheSet, cacheDelete, cacheStats, warmCache, invalidateByTags } from "@/features/cloud-infra";
import { z } from "zod";

const setSchema = z.object({
  namespace: z.string().min(1), key: z.string().min(1),
  value: z.record(z.string(), z.unknown()),
  ttlSeconds: z.number().int().min(1).max(86400).default(300),
  tags: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "stats") return NextResponse.json(await cacheStats());
  const ns = url.searchParams.get("namespace");
  const key = url.searchParams.get("key");
  if (ns && key) {
    const value = await cacheGet(ns, key);
    return NextResponse.json({ found: value !== null, value });
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "namespace + key required, or action=stats" } }, { status: 400 });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = setSchema.parse(await req.json());
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "warm") {
    const entries = z.array(z.object({ key: z.string(), value: z.record(z.string(), z.unknown()), ttlSeconds: z.number().optional() })).parse(body.value?.entries ?? []);
    const count = await warmCache(body.namespace, entries);
    return NextResponse.json({ warmed: count });
  }
  if (url.searchParams.get("action") === "invalidate") {
    const tags = z.array(z.string()).parse(body.tags ?? []);
    const count = await invalidateByTags(tags);
    return NextResponse.json({ invalidated: count });
  }
  await cacheSet(body);
  return NextResponse.json({ success: true }, { status: 201 });
});

export const DELETE = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const ns = url.searchParams.get("namespace");
  const key = url.searchParams.get("key");
  if (ns && key) { await cacheDelete(ns, key); return NextResponse.json({ success: true }); }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "namespace + key required" } }, { status: 400 });
});
