import { describe, it, expect } from "vitest";
import { clearCookieOptions, SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../auth.cookies";

describe("Logout & Cookie Clearing", () => {
  it("provides correct cookie options for clearing auth tokens", () => {
    const opts = clearCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(0);
  });

  it("references consistent cookie names", () => {
    expect(SESSION_COOKIE_NAME).toBe("edubek_session");
    expect(REFRESH_COOKIE_NAME).toBe("edubek_refresh");
  });
});
