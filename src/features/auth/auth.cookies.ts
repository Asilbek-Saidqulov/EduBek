import { cookies } from "next/headers";
import { signSessionPayload, type SessionPayload } from "@/lib/session-token";

export const SESSION_COOKIE_NAME = "edubek_session";
export const REFRESH_COOKIE_NAME = "edubek_refresh";

export const serializeCookie = (name: string, value: string, options?: any) => `${name}=${value}; Path=/`;
export const clearCookieOptions = () => ({ httpOnly: true, path: "/", maxAge: 0 });
export const refreshCookieOptions = () => ({ httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
export const sessionCookieOptions = () => ({
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
});

export async function setSessionCookie(payload: {
  userId: string;
  email: string;
  platformRoles: string[];
  sessionId?: string;
}) {
  const cookieStore = await cookies();
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: SessionPayload = {
    userId: payload.userId,
    email: payload.email,
    platformRoles: payload.platformRoles,
    sessionId: payload.sessionId,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  };
  cookieStore.set(SESSION_COOKIE_NAME, signSessionPayload(tokenPayload), sessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}
