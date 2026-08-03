/**
 * POST /api/education-os/agents/chat — Chat with a specific agent
 *
 * Body: { agentType, message, scopeType?, scopeId?, locale? }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { chatWithAgent } from "@/features/education-os";
import { z } from "zod";

const schema = z.object({
  agentType: z.enum([
    "teacher", "student", "curriculum", "assessment", "organization",
    "marketplace", "planner", "notification", "analytics",
  ]),
  message: z.string().min(1).max(2000),
  scopeType: z.enum(["user", "classroom", "organization", "system"]).default("user"),
  scopeId: z.string().optional(),
  locale: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = schema.parse(await req.json());
  const result = await chatWithAgent({
    agentType: body.agentType,
    message: body.message,
    scopeType: body.scopeType,
    scopeId: body.scopeId ?? ctx.userId,
    locale: body.locale ?? ctx.locale ?? "en",
  });
  return NextResponse.json(result);
});
