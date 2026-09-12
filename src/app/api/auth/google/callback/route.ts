import { NextResponse, type NextRequest } from "next/server";
import { loginOrRegisterWithGoogle } from "@/features/auth/auth.service";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  refreshCookieOptions,
  sessionCookieOptions,
} from "@/features/auth/auth.cookies";

export const dynamic = "force-dynamic";

function appOrigin(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.EDUBEK_PUBLIC_URL;
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "edubek.vercel.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function fail(req: NextRequest, locale: string, reason: string) {
  const origin = appOrigin(req);
  const url = new URL(`/${locale}/login`, origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") || "";
  const saved = req.cookies.get("edubek_google_state")?.value || "";
  const locale = (state.split(".")[0] || "uz").slice(0, 5);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return fail(req, locale, "google_not_configured");
  }
  if (!code || !state || !saved || saved !== state) {
    return fail(req, locale, "google_denied");
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("[google oauth] token", tokenJson);
      return fail(req, locale, "google_token");
    }

    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const info = (await infoRes.json()) as {
      email?: string;
      name?: string;
      picture?: string;
      verified_email?: boolean;
    };
    if (!infoRes.ok || !info.email) {
      return fail(req, locale, "google_profile");
    }

    const { session } = await loginOrRegisterWithGoogle({
      email: info.email,
      name: info.name,
      avatarUrl: info.picture,
      emailVerified: Boolean(info.verified_email),
      locale,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const dest = NextResponse.redirect(new URL(`/${locale}/dashboard`, origin));
    dest.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, sessionCookieOptions());
    dest.cookies.set(REFRESH_COOKIE_NAME, session.refreshToken, refreshCookieOptions());
    dest.cookies.set("edubek_google_state", "", { path: "/", maxAge: 0 });
    return dest;
  } catch (error) {
    console.error("[google oauth] callback", error);
    return fail(req, locale, "google_failed");
  }
}
