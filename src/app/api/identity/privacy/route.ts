/** GET/POST/PUT /api/identity/privacy — Privacy & consent */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createPrivacySettings, getPrivacySettingsForIdentity, updatePrivacySettings, setOrganizationOverride, setParentalConsent, canShareData, recordConsent, revokeConsent, listConsentRecords, hasConsent } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const identityId = searchParams.get("identityId") ?? ctx.userId;
  return NextResponse.json({
    privacy: getPrivacySettingsForIdentity(identityId),
    consent: listConsentRecords(identityId),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "consent") return NextResponse.json({ consent: recordConsent(body) });
  if (body.action === "has_consent") return NextResponse.json({ has: hasConsent(body.identityId, body.purpose) });
  if (body.action === "can_share") return NextResponse.json({ result: canShareData(body.identityId, body.organizationId ?? null) });
  const privacy = createPrivacySettings(body);
  return NextResponse.json({ privacy }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "consent_revoke") return NextResponse.json({ consent: revokeConsent(body.identityId, body.purpose) });
  if (body.action === "org_override") return NextResponse.json({ privacy: setOrganizationOverride(body.identityId, body.organizationId, body.enabled) });
  if (body.action === "parental_consent") return NextResponse.json({ privacy: setParentalConsent(body.identityId, body.parentIdentityId) });
  return NextResponse.json({ privacy: updatePrivacySettings(body.identityId, body.updates) });
});
