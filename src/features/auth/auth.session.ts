import { setSessionCookie, setRefreshCookie, clearSessionCookie } from "./auth.cookies";
import { getAuthContext } from "./auth.context";

export async function createSession(sessionToken: string, refreshToken: string) {
  await setSessionCookie(sessionToken);
  await setRefreshCookie(refreshToken);
}

export async function destroySession() {
  await clearSessionCookie();
}

export { getAuthContext };

