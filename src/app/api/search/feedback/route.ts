/** POST /api/search/feedback — Record search feedback (clicks, helpfulness) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { recordSearchFeedback } from "@/features/semantic-search";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(1).max(500),
  clickedEntityId: z.string().optional(),
  clickedEntityType: z.string().optional(),
  isHelpful: z.boolean().optional(),
  locale: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = schema.parse(await req.json());

  await recordSearchFeedback({
    userId: ctx.userId,
    query: body.query,
    clickedEntityId: body.clickedEntityId,
    clickedEntityType: body.clickedEntityType,
    isHelpful: body.isHelpful,
    locale: ctx.locale ?? body.locale,
  });

  return NextResponse.json({ success: true });
});
