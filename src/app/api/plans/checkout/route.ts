import { NextRequest, NextResponse } from "next/server";
import { PAYMENTS_ENABLED, getPlan } from "@/lib/plans";
import { getAuthContext } from "@/features/auth";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext().catch(() => null);
  if (!ctx?.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body.planId);

  if (plan.id === "free") {
    return NextResponse.json({ ok: true, planId: "free", message: "You are already on Free." });
  }

  if (!PAYMENTS_ENABLED || !plan.paymentsReady) {
    return NextResponse.json(
      {
        error: {
          code: "PAYMENTS_DISABLED",
          message: "Paid plans are listed but checkout is off until a payment provider is connected. Set PAYMENTS_ENABLED=true then wire this route.",
        },
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "PROVIDER_NOT_WIRED",
        message: "PAYMENTS_ENABLED is on, but no provider is attached yet. Add Click / Stripe here.",
      },
    },
    { status: 501 },
  );
}
