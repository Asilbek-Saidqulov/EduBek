import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "edubek_session";
export const REFRESH_COOKIE_NAME = "edubek_refresh";

export const serializeCookie = (name: string, value: string, options?: any) => `${name}=${value}; Path=/`;
export const clearCookieOptions = () => ({ httpOnly: true, path: "/", maxAge: 0 });
export const refreshCookieOptions = () => ({ httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
export const sessionCookieOptions = () => ({ httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });

export async function setSessionCookie(payload: {
  userId: string;
  email: string;
  platformRoles: string[];
}) {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(payload)).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

