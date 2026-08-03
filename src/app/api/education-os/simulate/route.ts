/**
 * POST /api/education-os/simulate — Run a dry-run simulation
 *
 * Body: { scenario, params, locale? }
 *
 * Supported scenarios:
 *   • make_subject_mandatory  — What if { subject, grade } becomes mandatory?
 *   • add_curriculum_framework — What if we adopt { framework, organizationId? }?
 *   • reduce_class_size        — What if class sizes drop to { targetSize }?
 *   • introduce_ai_tutoring    — What if we offer AI tutoring to { organizationId? }?
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { runSimulation } from "@/features/education-os";
import { z } from "zod";

const schema = z.object({
  scenario: z.string().min(1).max(100),
  params: z.record(z.string(), z.unknown()).default({}),
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
  const result = await runSimulation({
    scenario: body.scenario,
    params: body.params,
    locale: body.locale ?? ctx.locale ?? "en",
  });
  return NextResponse.json(result, { status: 201 });
});
