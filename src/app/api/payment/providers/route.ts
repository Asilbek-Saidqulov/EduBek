import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { listProviders } from "@/features/payment";

/** GET /api/payment/providers — list available payment providers + status. */
export const GET = withErrorHandler(async () => {
  const providers = listProviders();
  return NextResponse.json({ providers });
});
