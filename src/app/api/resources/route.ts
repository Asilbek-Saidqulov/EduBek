import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { listMyResources } from "@/features/resource";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const result = await listMyResources(ctx, {
    limit: Number(searchParams.get("limit") || 9),
    offset: Number(searchParams.get("offset") || 0),
    search: searchParams.get("search") || undefined,
    resourceType: searchParams.get("resourceType") || undefined,
    status: searchParams.get("status") || undefined,
  });

  return NextResponse.json(result);
}