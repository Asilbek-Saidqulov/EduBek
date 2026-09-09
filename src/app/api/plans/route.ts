import { NextResponse } from "next/server";
import { listPlansForClient } from "@/lib/plans";

export async function GET() {
  return NextResponse.json(listPlansForClient());
}
