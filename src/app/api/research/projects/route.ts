/** GET+POST /api/research/projects — List/create research projects */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listProjects, createProject, updateProjectStatus } from "@/features/research-platform";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(300), description: z.string().max(5000).optional(),
  researchType: z.string().default("applied"), field: z.string().optional(),
  teamMembers: z.array(z.string()).default([]), organizationId: z.string().optional(),
  funding: z.record(z.string(), z.unknown()).optional(), ethicsApproved: z.boolean().default(false),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const projects = await listProjects({
    status: url.searchParams.get("status") ?? undefined,
    principalInvestigator: url.searchParams.get("principalInvestigator") ?? ctx.userId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    field: url.searchParams.get("field") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ projects, total: projects.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "update_status") {
    const body = await req.json();
    const project = await updateProjectStatus(body.id, body.status);
    return NextResponse.json(project);
  }
  const body = schema.parse(await req.json());
  const project = await createProject({ ...body, principalInvestigator: ctx.userId });
  return NextResponse.json(project, { status: 201 });
});
