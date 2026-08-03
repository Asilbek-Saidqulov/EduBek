/**
 * EduBek — Next.js instrumentation hook.
 *
 * NOTE: This file runs in the Edge runtime. It must NOT import any module
 * that uses Node.js APIs (db, crypto, etc.). Listener registration happens
 * lazily in the event bus on first publish() call (see event-bus/index.ts).
 */

export async function register() {
  // Intentionally empty — listener registration is handled lazily by
  // the InMemoryEventBus on first publish() call. This avoids Edge runtime
  // errors from importing Node.js-only modules (db, crypto, etc.).
}
