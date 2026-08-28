import { NextRequest, NextResponse } from "next/server";
import { AI_CREDIT_PACKS } from "@/features/economy/constants";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    packs: AI_CREDIT_PACKS.map((p) => ({
      id: p.id,
      name: p.name,
      units: p.units,
      priceUzs: p.priceUzs.toString(),
      popular: !!p.popular,
      savingsLabel: p.savingsLabel,
    })),
  });
}
