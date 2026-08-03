/**
 * GET /api/education-os/analytics — Get executive analytics dashboard
 *
 * Query: ?level=teacher|department|school|district&organizationId=...&scopeId=...
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAnalyticsSummary } from "@/features/education-os";
import { z } from "zod";

const schema = z.object({
  level: z.enum(["teacher", "department", "school", "district"]).default("school"),
  organizationId: z.string().optional(),
  scopeId: z.string().optional(),
  locale: z.string().optional(),
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
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);
  const summary = await getAnalyticsSummary({
    level: parsed.level,
    organizationId: parsed.organizationId,
    scopeId: parsed.scopeId,
    locale: parsed.locale ?? ctx.locale ?? "en",
  });
  return NextResponse.json(summary);
});
