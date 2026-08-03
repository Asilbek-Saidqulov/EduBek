/**
 * GET  /api/education-os/automation — List automation rules
 * POST /api/education-os/automation — Create a new rule OR seed built-in policies (?action=seed)
 * PATCH /api/education-os/automation — Update a rule (?id=...)
 * DELETE /api/education-os/automation — Delete a rule (?id=...)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  seedBuiltinAutomationPolicies,
} from "@/features/education-os";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scopeType: z.enum(["user", "classroom", "organization", "system"]),
  scopeId: z.string().min(1),
  trigger: z.object({
    event: z.string().min(1),
    conditions: z.record(z.string(), z.unknown()).optional(),
  }),
  actions: z.array(z.object({
    type: z.string().min(1),
    params: z.record(z.string(), z.unknown()).default({}),
  })),
  enabled: z.boolean().default(true),
  maxPerHour: z.number().int().min(1).max(1000).default(10),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  enabled: z.boolean().optional(),
  trigger: z.object({
    event: z.string().min(1),
    conditions: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
  actions: z.array(z.object({
    type: z.string().min(1),
    params: z.record(z.string(), z.unknown()).default({}),
  })).optional(),
  maxPerHour: z.number().int().min(1).max(1000).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const rules = await listAutomationRules({
    ownerId: ctx.userId,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    enabled: url.searchParams.get("enabled") === "true" ? true : url.searchParams.get("enabled") === "false" ? false : undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ rules, total: rules.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "seed") {
    await seedBuiltinAutomationPolicies(ctx.userId);
    return NextResponse.json({ success: true, message: "Built-in automation policies seeded" });
  }
  const body = createSchema.parse(await req.json());
  const rule = await createAutomationRule({ ...body, ownerId: ctx.userId });
  return NextResponse.json(rule, { status: 201 });
});

export const PATCH = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "id query parameter required" } },
      { status: 400 },
    );
  }
  const body = updateSchema.parse(await req.json());
  const rule = await updateAutomationRule(id, body);
  return NextResponse.json(rule);
});

export const DELETE = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "id query parameter required" } },
      { status: 400 },
    );
  }
  await deleteAutomationRule(id);
  return NextResponse.json({ success: true });
});
