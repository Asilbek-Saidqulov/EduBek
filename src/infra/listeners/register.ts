/**
 * EduBek — listener registration entry point.
 *
 * Called from `src/instrumentation.ts` on server boot *and* lazily from the
 * event bus on the first `publish()`. Both call sites are idempotent — the
 * `registerAllListeners()` function uses a module-level guard so that
 * subsequent invocations are no-ops.
 *
 * Adding a new listener module:
 *   1. Implement `registerXxxListeners()` in `xxx-listeners.ts`.
 *   2. Call it from `registerAllListeners()` below.
 *   3. Subscribe to events inside the registration function — never at
 *      module top-level, so that importing the module does not have side
 *      effects on the event bus.
 */

import { getLogger } from "@/lib/logger";
import { registerAuditListeners } from "@/infra/listeners/audit-listeners";
import { registerNotificationListeners } from "@/infra/listeners/notification-listeners";
import { registerRealtimeListeners } from "@/infra/listeners/realtime-listeners";

const log = getLogger("listeners");

let registered = false;

export function registerAllListeners(): void {
  if (registered) return;
  registered = true;
  try {
    registerAuditListeners();
    registerNotificationListeners();
    registerRealtimeListeners();
    log.debug("listeners.registered");
  } catch (err) {
    // Reset so a later retry can succeed (e.g. after a hot reload that
    // cleared the singleton).
    registered = false;
    log.error("listeners.register_failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

/** Test-only escape hatch — resets the idempotency guard. Never call from app code. */
export function __resetListenerRegistrationForTests(): void {
  registered = false;
}
