import { createHmac, timingSafeEqual } from "crypto";

export function getSessionSecret(): string {
  const s =
    process.env.EDUBEK_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("EDUBEK_SESSION_SECRET is required in production");
  }
  return "edubek-dev-session-secret-change-me";
}

export type SessionPayload = {
  userId: string;
  email: string;
  platformRoles: string[];
  sessionId?: string;
  iat: number;
  exp: number;
};

export function signSessionPayload(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!body || !mac) return null;

  const expected = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.userId) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
