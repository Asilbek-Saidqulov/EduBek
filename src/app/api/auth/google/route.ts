import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function appOrigin(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.EDUBEK_PUBLIC_URL;
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "edubek.vercel.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_CONFIGURED",
          message: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel, then add the callback URL in Google Cloud.",
        },
      },
      { status: 503 },
    );
  }

  const locale = req.nextUrl.searchParams.get("locale") || "uz";
  const origin = appOrigin(req);
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
  const state = `${locale}.${randomBytes(16).toString("hex")}`;

  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", clientId);
  google.searchParams.set("redirect_uri", redirectUri);
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("access_type", "online");
  google.searchParams.set("prompt", "select_account");
  google.searchParams.set("state", state);

  const res = NextResponse.redirect(google.toString());
  res.cookies.set("edubek_google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
