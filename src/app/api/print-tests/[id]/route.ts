import { NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getPrintPack } from "@/features/print-tests/store";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext().catch(() => null);
  if (!auth?.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const pack = await getPrintPack(auth.userId, id);
    if (!pack) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }
    return NextResponse.json({ success: true, pack });
  } catch (error) {
    console.error("[print-tests] get failed", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Print pack table is not ready." } },
      { status: 500 }
    );
  }
}
