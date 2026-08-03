/** GET/POST/PUT /api/notifications/preferences — User notification preferences */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPreferencesForUser, createPreferences, updateChannelPreference, setQuietHours, addMutePeriod, removeMutePeriod, setLanguagePreference, setDigestPreference, setOptIn, setParentControls, setTeacherControls, supportsAllDigestPreferences } from "@/features/notifications-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({ preferences: getPreferencesForUser(ctx.userId), digestOptions: supportsAllDigestPreferences() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const prefs = createPreferences({ ...body, userId: ctx.userId });
  return NextResponse.json({ preferences: prefs }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let prefs = null;
  if (body.field === "channel") prefs = updateChannelPreference(ctx.userId, body.channelId, body.updates);
  else if (body.field === "quietHours") prefs = setQuietHours(ctx.userId, body.quietHours);
  else if (body.field === "mutePeriod" && body.action === "add") prefs = addMutePeriod(ctx.userId, body.mutePeriod);
  else if (body.field === "mutePeriod" && body.action === "remove") prefs = removeMutePeriod(ctx.userId, body.muteId);
  else if (body.field === "language") prefs = setLanguagePreference(ctx.userId, body.language);
  else if (body.field === "digest") prefs = setDigestPreference(ctx.userId, body.digest);
  else if (body.field === "optIn") prefs = setOptIn(ctx.userId, body.optedIn);
  else if (body.field === "parentControls") prefs = setParentControls(ctx.userId, body.enabled, body.maxDaily);
  else if (body.field === "teacherControls") prefs = setTeacherControls(ctx.userId, body.enabled, body.classroomOnly);
  return NextResponse.json({ preferences: prefs });
});
