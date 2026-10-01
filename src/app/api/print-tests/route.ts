import { NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { listPrintPacks } from "@/features/print-tests/store";

export async function GET() {
  const auth = await getAuthContext().catch(() => null);
  if (!auth?.userId) {
    return NextResponse.json({ success: true, packs: [], saved: false });
  }
  try {
    const packs = await listPrintPacks(auth.userId);
    return NextResponse.json({ success: true, packs, saved: true });
  } catch (error) {
    console.error("[print-tests] list failed", error);
    return NextResponse.json({ success: true, packs: [], saved: false });
  }
}
