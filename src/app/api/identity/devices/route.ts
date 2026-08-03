/** GET/POST/PUT /api/identity/devices — Device registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listDevices, registerDevice, verifyDevice, revokeDevice, addDeviceRiskFlag, supportsAllDeviceTrusts, supportsAllDeviceStatuses } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? undefined;
  const status = searchParams.get("status") as any;
  return NextResponse.json({ devices: listDevices(identityId, status ?? undefined), trusts: supportsAllDeviceTrusts(), statuses: supportsAllDeviceStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "verify") return NextResponse.json({ device: verifyDevice(body.id) });
  if (body.action === "add_risk_flag") return NextResponse.json({ device: addDeviceRiskFlag(body.id, body.flag) });
  const device = registerDevice(body);
  return NextResponse.json({ device }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ device: revokeDevice(body.id, body.reason) });
});
