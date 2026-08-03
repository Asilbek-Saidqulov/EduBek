/** GET/POST /api/trust/evidence — Evidence registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listEvidence, registerEvidence, verifyEvidenceIntegrity, supportsAllEvidenceTypes } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const investigationId = searchParams.get("investigationId") ?? undefined;
  return NextResponse.json({ evidence: listEvidence(type ?? undefined, investigationId), types: supportsAllEvidenceTypes() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "verify") return NextResponse.json({ integrity: verifyEvidenceIntegrity(body.id) });
  const evidence = registerEvidence(body);
  return NextResponse.json({ evidence }, { status: 201 });
});
