import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const proxyHandler = createMiddleware(routing);

export default proxyHandler;
export { proxyHandler as proxy, proxyHandler as middleware };

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
