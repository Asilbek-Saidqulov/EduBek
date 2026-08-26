import { setSessionCookie, clearSessionCookie } from "./auth.cookies";
import { getAuthContext } from "./auth.context";

export async function createSession(user: {
  id: string;
  email: string;
  roles?: string[];
  platformRoles?: string[];
}) {
  await setSessionCookie({
    userId: user.id,
    email: user.email,
    platformRoles: user.platformRoles || user.roles || ["STUDENT"],
  });
}

export async function destroySession() {
  await clearSessionCookie();
}

export async function signSessionToken(payload: any): Promise<string> {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export { getAuthContext };

