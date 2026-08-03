/** GET+POST /api/studio/programming — List/create programming workspaces; POST ?action=grade — Grade submission */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listProgrammingWorkspaces, createProgrammingWorkspace, gradeProgrammingSubmission } from "@/features/learning-studio";
import { z } from "zod";

const createSchema = z.object({
  language: z.string().min(1), title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  starterCode: z.string().default(""), solutionCode: z.string().optional(),
  testCases: z.array(z.object({ input: z.string(), expectedOutput: z.string(), hidden: z.boolean() })).default([]),
  hints: z.array(z.object({ hint: z.string(), cost: z.number() })).default([]),
  aiDebugging: z.boolean().default(true), visualization: z.boolean().default(false),
  difficulty: z.string().default("medium"),
});

const gradeSchema = z.object({ workspaceId: z.string().min(1), code: z.string() });

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const workspaces = await listProgrammingWorkspaces({
    language: url.searchParams.get("language") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ workspaces, total: workspaces.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "grade") {
    const body = gradeSchema.parse(await req.json());
    const result = await gradeProgrammingSubmission(body);
    return NextResponse.json(result);
  }
  const body = createSchema.parse(await req.json());
  const workspace = await createProgrammingWorkspace(body);
  return NextResponse.json(workspace, { status: 201 });
});
