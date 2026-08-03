/** GET /api/platform-intelligence/organization-intelligence — Organization intelligence dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getOrganizationIntelligence } from "@/features/platform-intelligence";
import { z } from "zod";

const schema = z.object({
  organizationId: z.string().min(1),
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
  const { organizationId } = schema.parse(params);
  const intelligence = await getOrganizationIntelligence({ organizationId });
  if (!intelligence) throw notFound("Organization intelligence not available");
  return NextResponse.json(intelligence);
});
