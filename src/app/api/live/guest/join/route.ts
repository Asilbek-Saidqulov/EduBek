/**
 * POST /api/live/guest/join
 *
 * Join a live quiz as a guest — no authentication required.
 * Creates a LivePlayer with userId=null, isGuest=true.
 * Issues a signed guest JWT for session-scoped access.
 *
 * Body: { joinCode: string, displayName: string }
 * Response: { session, player, guestToken }
 *
 * SECURITY:
 *   - Join code is validated server-side
 *   - Session capacity is checked
 *   - A signed JWT (guestToken) is issued — all subsequent calls verify it
 *   - The guest can only interact with the session they joined
 *   - Rate limit: max 5 join attempts per IP per 5 minutes
 *   - Display name filtered for Unicode control chars (anti-spoofing)
 */
import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { z } from "zod";
import { guestJoin, enforceGuestJoinRateLimit } from "@/features/live-session/guest-service";

const guestJoinSchema = z.object({
  joinCode: z.string().min(4).max(20),
  // Display name is filtered for Unicode control characters + RTL override
  // to prevent visual spoofing in the leaderboard UI.
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[\p{L}\p{N}\p{Pd}\p{Pc} _'-]+$/u, "Display name contains invalid characters"),
});

function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined;
  return req.headers.get("x-real-ip") ?? undefined;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = guestJoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid join payload" } },
      { status: 400 },
    );
  }

  const ipAddress = getClientIp(req);
  // Rate limit: max 5 guest-join attempts per IP per 5 minutes. Prevents
  // join-code brute-force and session-capacity flooding.
  enforceGuestJoinRateLimit(ipAddress);
  const result = await guestJoin({ ...parsed.data, ipAddress });
  return NextResponse.json(result, { status: 201 });
});
