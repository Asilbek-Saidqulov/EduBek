/** GET /api/platform-intelligence/health — Platform health dashboard (optionally refresh) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getHealth } from "@/features/platform-intelligence";
import { z } from "zod";

const schema = z.object({
  refresh: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
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
  const { refresh } = schema.parse(params);
  const health = await getHealth(refresh);
  return NextResponse.json(health);
});
